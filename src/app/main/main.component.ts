import {Component, OnInit, ChangeDetectorRef, ViewChild, HostListener} from '@angular/core';
import {Title} from '@angular/platform-browser';

const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;
const dialog = electron.remote.dialog;

import {ExLinksModule} from '../services/utils/ex-links.module';

import {SentenceModel} from '../services/model/sentence.model';
import {ParserService} from '../parsers/base/parser.service';
import {ParserManagerService} from '../parsers/manager/parser-manager.service';
import {EngineManagerService} from '../providers/manager/engine-manager.service';
import engines from '../providers/manager/engines';
import {AboutComponent} from '../about/about.component';
import {SettingsComponent} from '../settings/settings.component';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  providers: [EngineManagerService, ParserManagerService]
})
export class MainComponent implements OnInit {
  sentences = [];  // new Array<SentenceModel>();
  cur_index = -1;
  cur_page = 0;
  parser: ParserService;

  @ViewChild(SettingsComponent) child_settings: SettingsComponent;
  @ViewChild(AboutComponent) child_about: AboutComponent;

  /*
  一段无解的代码，在ipcRenderer和ipcMain之间传递的userData不能承载this对象
  static onFileRead(event, err, data, userData): void {
    userData.reset();  // userData不可以是this
    const lines = data.split(/\n|\r\n/g);
    for (let line of lines) {
      line = line.trim();
      if (line) {
        console.log(`${userData.sentences.length}: ${line}`);
        userData.sentences[userData.sentences.length] = { source: line, target: '' };
      }
    }
  }*/

  constructor(private cdr: ChangeDetectorRef,
              private title: Title,
              private ems: EngineManagerService,
              private pms: ParserManagerService) {
  }

  reset(): void {
    this.cur_index = -1;
    this.sentences = [];
  }

  // ipcRenderer与ipcMain同步通信
  openFile(): void {
    const self = this;

    const options = {
      title: 'Open a Structured Text File',
      filters: [
        {name: 'Text Files', extensions: ['txt', 'html', 'md', 'po']}
      ]
    };

    dialog.showOpenDialog(options, (files) => {
      if (files) {
        self.reset();
        ipc.send('read-file', files);  // ('read-file', files, self);  进程之间不能传递对象
      }
    });
  }

  exportFile(): void {
    if (this.parser) {
      const segments = new Array<string>();
      for (let index = 0; index < this.sentences.length; ++index) {
        let target_text = '';
        const current = this.sentences[index];
        if (!current.ignore) {
          if (current.target === -1) {
            target_text = current.custom.target_text;
          } else if (current.target > -1) {
            target_text = current.refers[current.target].target_text;
          }
        }
        segments[index] = target_text;
      }
      this.parser.update(segments);

      const ext_name = /\.([^\.]+$)/.exec(this.title.getTitle())[1];
      const options = {
        title: 'Export the Translated File',
        filters: [
          {name: `Text Files (*.${ext_name})`, extensions: [ext_name]}
        ]
      };

      dialog.showSaveDialog(options, (filename) => {
        if (filename) {
          ipc.send('save-file', filename, this.parser.getLastData());
        }
      });
    }
  }

  // ipcRenderer与ipcMain同步通信，在JavaScript中，同步代码好丑陋
  openFileSync(): void {
    const self = this;
    dialog.showOpenDialog((files) => {
      if (files) {
        self.reset();
      } else {
        return;
      }
      // 同步通信，如果ipcMain没有返回，界面会僵住
      const data = ipc.sendSync('read-file', files);
      const lines = data.split(/\n|\r\n/g);
      for (let line of lines) {
        line = line.trim();
        if (line) {
          self.sentences[this.sentences.length] = {
            source: line,
            target: -2,
            ignore: false,
            hidden: false,
            status: 0,
            marked: 0,
            custom: null,
            refers: []  // new Array<TranslateModel>()
          };
        }
      }
      self.title.setTitle(`Eztrans - ${files[0]}`);
      self.rerender();
    });
  }

  onItemClick(index: number): void {
    if (index === this.cur_index) {
      return;
    }

    if (this.cur_index !== -1) {
      // $(`#table-${this.cur_index}`).toggleClass('inverted');
      $(`#item-${this.cur_index}`).css('background-color', 'white');
    }

    // lightcyan; palegreen; aliceblue; lightyellow; ghostwhite; azure, cornsilk
    // $(`#table-${index}`).toggleClass('inverted');
    const item_element = $(`#item-${index}`);
    item_element.css('background-color', 'gainsboro');

    this.cur_index = index;
    this.rerender();
  }

  onItemDblclick(index, sentence): void {
    this.translate(index, sentence);
  }

  onItemContextMenu(index: number): void {
    this.onItemClick(index);
    ipc.send('show-item-context-menu');
  }

  autoTranslate(): void {
    for (let index = 0; index < this.sentences.length; ++index) {
      const sentence = this.sentences[index];
      if (sentence.ignore || sentence.hidden || (sentence.refers.length === this.ems.getEnabledEngineCount()
          && sentence.status in [1, 2, 3])) {  // 避免重复发送请求
        continue;
      }
      this.translate(index, sentence);
    }
  }

  rerender(): void {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  translate(index: number, sentence: SentenceModel): void {
    const state_element = $(`#state-${index}`);
    state_element.parent().removeClass('ez-hide');
    sentence.status = 1;  // 发起请求
    state_element.attr('class', 'spinner loading icon');

    this.ems.translate(sentence.source).subscribe(
      res => {
        if (res.target_text.length > 0) {
          sentence.status = 2;  // 返回响应
          state_element.attr('class', 'notched circle loading icon');
        } else {
          sentence.status = 4;  // 告警
          state_element.attr('class', 'warning circle icon');
        }

        let exist = -1;
        for (let i = 0; i < sentence.refers.length; ++i) {
          if (res.engine_name === sentence.refers[i].engine_name) {
            sentence.refers[i] = res;  // 覆盖
            exist = i;
          }
        }
        if (exist === -1) {
          sentence.refers[sentence.refers.length] = res;
          if (sentence.target === -2) {
            sentence.target = 0;
          } else if (sentence.target >= 0 && sentence.target !== sentence.refers.length - 1) {
            const cur_state = sentence.refers[sentence.target].trans_state;
            const new_state = sentence.refers[sentence.refers.length - 1].trans_state;
            if (cur_state < new_state) {
              sentence.target = sentence.refers.length - 1;
            }
          }
        }

        if (sentence.refers.length === this.ems.getEnabledEngineCount()) {
          if (!(state_element.attr('class') in ['warning circle icon', 'remove circle icon'])) {
            sentence.status = 3;  // 翻译完成
            state_element.parent().toggleClass('ez-hide');
          }
        }
        this.rerender();
      },
      err => {
        console.log(err);  // TODO: 提供错误信息展示方案
        sentence.status = 5;  // 错误
        state_element.attr('class', 'remove circle icon');
        this.rerender();
      }
    );
  }

  getStatusIcon(sentence: SentenceModel): string {
    let icon = 'placeholder icon';
    if (sentence.ignore) {
      icon = 'ban icon';
    } else if (sentence.status === 0) {
      icon = 'placeholder icon';
    } else if (sentence.status === 1) {
      icon = 'spinner loading icon';
    } else if (sentence.status === 2) {
      icon = 'notched circle loading icon';
    } else if (sentence.status === 3) {
      icon = 'placeholder icon';
    } else if (sentence.status === 4) {
      icon = 'warning circle icon';
    } else if (sentence.status === 5) {
      icon = 'remove circle icon';
    }
    return icon;
  }

  toggle(): void {
    console.log('Hello World!');
    $('.ui.sidebar').sidebar({
      context: 'body',
      dimPage: false
      /*
      onVisible: function() {
          $('body').click(function(e){
              this.unbind(e);
          });
      },
      onShow: function() {
          $('.ui.sidebar').css("z-index",999);
      },
      onHide: function() {
          $('.ui.sidebar').css("z-index",1);
      }*/
    }).sidebar('toggle');
  }

  getEngineIcon(sentence: SentenceModel): string {
    let icon = '';
    if (sentence.target === -2) {
      icon = 'refresh icon';  // TODO: 手动点击翻译
    } else if (sentence.target === -1) {
      icon = 'star icon';
    } else {
      icon = engines[sentence.refers[sentence.target].engine_name].icon;
    }
    return icon;
  }

  getTargetText(sentence: SentenceModel): string {
    let target_text = '';
    if (sentence.target === -2) {
      target_text = '';
    } else if (sentence.target === -1) {
      target_text = sentence.custom.target_text;
    } else {
      target_text = sentence.refers[sentence.target].target_text;
    }
    return target_text;
  }

  getPageCount(): number {
    const pageCount = (this.sentences.length / 100) + ((this.sentences.length % 100) ? 1 : 0);
    return parseInt(pageCount.toString(), 10);
  }

  getPageData(): Array<SentenceModel> {
    return this.sentences.slice(this.cur_page * 100, (this.cur_page + 1) * 100);
  }

  showSettings(): void {
    this.child_settings.show();
  }

  showAbout(): void {
    this.child_about.show();
  }

  onMouseEnter(index: number): void {
    if (index !== this.cur_index) {
      const index_element = $(`#item-${index}`);
      // index_element.attr('normal-background-color', index_element.css('background-color'));
      index_element.css('background-color', 'whitesmoke');  // lavender, ghostwhite, whitesmoke
    }

    $(`#mark-${index}`).removeClass('ez-hide');
    this.mouseEnterShow(index);
  }

  onMouseLeave(index: number): void {
    if (index !== this.cur_index) {
      const index_element = $(`#item-${index}`);
      if (index === this.cur_index) {
        index_element.css('background-color', 'gainsboro');
      } else {
        index_element.css('background-color', 'white');
      }
    }

    const mark_element = $(`#mark-${index}`);
    if (this.sentences[index].marked || index === this.cur_index) {
    } else {
      if (!mark_element.hasClass('ez-hide')) {
        mark_element.addClass('ez-hide');
      }
    }
    this.mouseLeaveHide(index);
  }

  refresh(): void {
    if (this.sentences[this.cur_index].ignore || this.sentences[this.cur_index].hidden) {
      return;
    }

    if (this.sentences[this.cur_index].target !== -1) {
      this.sentences[this.cur_index].target = -2;
    }
    this.sentences[this.cur_index].refers = [];
    this.translate(this.cur_index, this.sentences[this.cur_index]);
  }

  mouseEnterShow(index: number): void {
    $(`#exec-${index}`).removeClass('ez-hide');
  }

  mouseLeaveHide(index: number): void {
    $(`#exec-${index}`).toggleClass('ez-hide');
  }

  getMarkVisibility(index: number): string {
    let vz = 'ez-hide';
    if (this.sentences[index].marked || index === this.cur_index) {
      $(`#mark-${index}`).removeClass('ez-hide');
      vz = '';
    }
    return vz;
  }

  changeFlagIcon(sentence: SentenceModel): void {
    sentence.marked = !sentence.marked;
    this.rerender();
  }

  @HostListener('window:keydown.arrowright', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    if (document.activeElement.getAttribute('contenteditable')) {
      return;
    }

    const next = this.cur_index + 1;
    if (next < this.sentences.length) {
      this.onItemClick(next);

      const tran_list = document.getElementById('trans-list');
      const next_item = document.getElementById(`item-${next}`);
      if (tran_list.scrollTop < next_item.offsetTop + next_item.clientHeight - tran_list.clientHeight) {
        tran_list.scrollTop = next_item.offsetTop + next_item.clientHeight - tran_list.clientHeight;
      } else if (tran_list.scrollTop > next_item.offsetTop) {
        tran_list.scrollTop = next_item.offsetTop;
      }
      event.preventDefault();
    }
  }

  @HostListener('window:keydown.arrowleft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    if (document.activeElement.getAttribute('contenteditable')) {
      return;
    }

    const prev = this.cur_index - 1;
    if (prev >= 0) {
      this.onItemClick(prev);

      const tran_list = document.getElementById('trans-list');
      const prev_item = document.getElementById(`item-${prev}`);
      if (tran_list.scrollTop > prev_item.offsetTop) {
        tran_list.scrollTop = prev_item.offsetTop;
      } else if (tran_list.scrollTop < prev_item.offsetTop + prev_item.clientHeight - tran_list.clientHeight) {
        tran_list.scrollTop = prev_item.offsetTop + prev_item.clientHeight - tran_list.clientHeight;
      }
      event.preventDefault();
    }
  }

  ngOnInit() {
    // ipcMain异步读取文件，返回文件数据

    // 这样传递函数是无解的，多么痛的领悟...如果不习惯异步编程，就告别JavaScript吧
    // ipc.on('file-read', MainComponent.onFileRead);

    const self = this;

    ipc.on('file-read', (event, err, data, filePath) => {
      self.reset();
      const ext_name = /\.([^\.]+$)/.exec(filePath)[1];
      self.parser = this.pms.getParser(ext_name);
      self.parser.parse(data).subscribe(
        res => {
          self.sentences[self.sentences.length] = {
            source: res,
            target: -2,
            ignore: false,
            hidden: false,
            status: 0,
            marked: false,
            custom: null,
            refers: []  //  new Array<TranslateModel>()
          };
        },
        error => {
          console.log(error);  // TODO: 提供错误信息展示方案
        },
        () => {
          self.rerender();
        }
      );

      self.title.setTitle(`Eztrans - ${filePath}`);
      self.rerender();
    });

    ipc.on('file-saved', (event, err) => {
      console.log('File Saved!');  // TODO: 自动打开文件？
    });

    ipc.on('refresh', (event) => {
      self.refresh();
    });

    ipc.on('toggle-flag', (event) => {
      self.changeFlagIcon(self.sentences[self.cur_index]);
    });

    // 安装外部链接
    ExLinksModule.applyExLinks();
  }

}
