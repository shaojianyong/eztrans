/// <reference path="../../types/jquery-highlight/index.d.ts" />

import {Component, OnInit, ChangeDetectorRef, ViewChild, HostListener} from '@angular/core';
import {Title} from '@angular/platform-browser';

const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;
const dialog = electron.remote.dialog;

import {ExLinksModule} from '../services/utils/ex-links.module';

import { FunctionUtils } from '../services/utils/function-utils';
import {SentenceModel} from '../services/model/sentence.model';
import {TranslateModel} from '../services/model/translate.model';
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
  search_text = '';
  search_result = [];
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
    this.cur_page = 0;
    this.cur_index = -1;
    this.sentences = [];
    this.search_result = [];
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
      const segments = [];
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

      const extName = FunctionUtils.getExtName(this.title.getTitle()).toLowerCase();
      const expInfo = this.pms.getExportInfo(extName);
      const options = {
        title: expInfo.title,
        filters: expInfo.filters
      };

      dialog.showSaveDialog(options, (filename) => {
        if (filename) {
          const fileExt = FunctionUtils.getExtName(filename).toLowerCase();
          ipc.send('save-file', filename, this.parser.getLastData(fileExt));
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

  onItemDblclick(index): void {
    this.translate(index, this.sentences[index]);
  }

  onItemContextMenu(index: number): void {
    this.onItemClick(index);
    ipc.send('show-item-context-menu', this.getPageCount(), this.cur_page);
  }

  autoTranslate(): void {
    for (let index = 0; index < this.sentences.length; ++index) {
      const sentence = this.sentences[index];
      if (sentence.ignore || (sentence.refers.length === this.ems.getEnabledEngineCount()
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

  forceRerender(event: any): void {
    if (event.forceShowSelected) {
      this.showSelectedItem();
    }
    this.rerender();
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
        for (let index = 0; index < sentence.refers.length; ++index) {
          if (res.engine_name === sentence.refers[index].engine_name) {
            sentence.refers[index] = res;  // 覆盖
            exist = index;
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

  getStatusIcon(index: number): string {
    const sentence = this.sentences[index];
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

  getEngineIcon(index: number): string {
    const sentence = this.sentences[index];
    let icon = '';
    if (sentence.target === -2) {
      icon = 'refresh icon';  // TODO: 手动点击翻译
    } else if (sentence.target === -1) {
      icon = 'user outline icon';
    } else {
      icon = engines[sentence.refers[sentence.target].engine_name].icon;
    }
    return icon;
  }

  getTargetText(index: number): string {
    const sentence = this.sentences[index];
    if (sentence.ignore) {
      return '';
    }

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
    let count = 0;
    if (this.search_text) {
      count = this.search_result.length;
    } else {
      count = this.sentences.length;
    }
    return Math.floor(count / 100) + ((count % 100) ? 1 : 0);
  }

  getPageRange(): Array<number> {
    let indexArray = [];
    if (this.search_text) {
      indexArray = this.search_result;
    } else {
      indexArray = Array.from(new Array(this.sentences.length), (x, i) => i);
    }
    return indexArray.slice(this.cur_page * 100, (this.cur_page + 1) * 100);
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

  retranslate(): void {
    if (this.sentences[this.cur_index].ignore) {
      return;
    }

    if (this.sentences[this.cur_index].target !== -1) {
      this.sentences[this.cur_index].target = -2;
    }
    this.sentences[this.cur_index].refers = [];
    this.translate(this.cur_index, this.sentences[this.cur_index]);
  }

  forceRetranslate(event: any): void {
    if (event.forceShowSelected) {
      this.showSelectedItem();
    }
    this.retranslate();
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

  changeFlagIcon(): void {
    const sentence = this.sentences[this.cur_index];
    sentence.marked = !sentence.marked;
    this.rerender();
  }

  @HostListener('window:keydown.arrowright', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    if (document.activeElement.getAttribute('contenteditable') || this.cur_index === -1) {
      return;
    }

    // const next = this.cur_index + 1;
    const range = this.getPageRange();
    const index = range.indexOf(this.cur_index);
    if (index < range.length - 1) {
      const next = range[index + 1];
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
    if (document.activeElement.getAttribute('contenteditable') || this.cur_index === -1) {
      return;
    }

    const range = this.getPageRange();
    const index = range.indexOf(this.cur_index);
    if (index > 0) {
      const prev = range[index - 1];
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

  nextPage(): void {
    if (this.cur_page + 1 < this.getPageCount()) {
      this.cur_page++;
      document.getElementById('trans-list').scrollTop = 0;
      this.cur_index = -1;
      this.rerender();
    }
  }

  prevPage(): void {
    if (this.cur_page > 0) {
      this.cur_page--;
      document.getElementById('trans-list').scrollTop = 0;
      this.cur_index = -1;
      this.rerender();
    }
  }

  showSelectedItem(): void {
    if (this.cur_index !== -1) {
      const tran_list = document.getElementById('trans-list');
      const tran_item = document.getElementById(`item-${this.cur_index}`);
      if (tran_list.scrollTop > tran_item.offsetTop) {
        tran_list.scrollTop = tran_item.offsetTop;
      } else if (tran_list.scrollTop < tran_item.offsetTop + tran_item.clientHeight - tran_list.clientHeight) {
        tran_list.scrollTop = tran_item.offsetTop + tran_item.clientHeight - tran_list.clientHeight;
      }
    }
  }

  skipOver(): void {
    this.sentences[this.cur_index].ignore = !this.sentences[this.cur_index].ignore;
    this.rerender();
  }

  getStatInfo(): string {
    const stats = {
      skipped: 0,  // 跳过的
      undealt: 0,  // 未翻译的
      revised: 0   // 修订的
      };

    for (const sentence of this.sentences) {
      if (sentence.ignore) {
        ++stats.skipped;
      } else if (sentence.target === -2) {
        ++stats.undealt;
      } else if (sentence.target === -1) {
        ++stats.revised;
      }
    }
    return `un=${stats.undealt} sk=${stats.skipped} rv=${stats.revised}`;
  }

  // TODO: 添加在原文中搜索还是在译文中搜索选项；添加是否忽略大小写选项；添加是否搜索单词选项
  onSearchInput(inputBox: HTMLInputElement): void {
    const text = inputBox.value.trim();
    if (text) {
      if (text === this.search_text) {
        return;
      }

      this.cur_page = 0;
      this.cur_index = -1;
      this.search_result = [];

      for (let index = 0; index < this.sentences.length; ++index) {
        const str = text.toLowerCase();
        const source_text = this.sentences[index].source.toLowerCase();
        const target_text = this.getTargetText(index).toLowerCase();
        if (source_text.indexOf(str) !== -1 || target_text.indexOf(str) !== -1) {
          this.search_result[this.search_result.length] = index;
        }
      }
      this.search_text = text;
      this.rerender();
      const transList = $('#trans-list');
      transList.unhighlight();
      transList.highlight(this.search_text);
    } else {
      this.onCloseSearch(inputBox);
    }
  }

  onCloseSearch(inputBox: HTMLInputElement): void {
    inputBox.value = '';
    this.cur_page = 0;
    this.cur_index = -1;
    this.search_text = '';
    this.search_result = [];
    this.rerender();
    $('#trans-list').unhighlight();
  }

  // only for test
  test(): void {
  }

  ngOnInit() {
    // ipcMain异步读取文件，返回文件数据

    // 这样传递函数是无解的，多么痛的领悟...如果不习惯异步编程，就告别JavaScript吧
    // ipc.on('file-read', MainComponent.onFileRead);

    const self = this;

    ipc.on('file-read', (event, err, data, filePath) => {
      self.reset();
      const ext_name = FunctionUtils.getExtName(filePath);
      self.parser = this.pms.getParser(ext_name);
      self.parser.parse(data).subscribe(
        res => {
          const sentence = {
            source: res.source,
            target: -2,
            ignore: false,
            status: 0,
            marked: false,
            custom: null,
            refers: []  //  new Array<TranslateModel>()
          };

          if (res.target) {
            sentence.target = -1;
            sentence.custom = new TranslateModel();
            sentence.custom.source_lang = self.ems.getSourceLanguage();
            sentence.custom.target_lang = self.ems.getTargetLanguage();
            sentence.custom.source_text = res.source;
            sentence.custom.target_text = res.target;
            sentence.custom.hz_translit =  '';
            sentence.custom.engine_name = 'user';
            sentence.custom.trans_state = 0;
          }
          self.sentences[self.sentences.length] = sentence;
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

    ipc.on('retranslate', (event) => {
      self.retranslate();
    });

    ipc.on('skip_over', (event) => {
      self.skipOver();
    });

    ipc.on('next_page', (event) => {
      self.nextPage();
    });

    ipc.on('previous_page', (event) => {
      self.prevPage();
    });

    ipc.on('toggle-flag', (event) => {
      self.changeFlagIcon();
    });

    // 安装外部链接
    ExLinksModule.applyExLinks();
  }

}
