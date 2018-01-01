import { Component, OnInit, ChangeDetectorRef, ViewChild, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';

const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;
const dialog = electron.remote.dialog;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const BrowserWindow = electron.remote.BrowserWindow;

import { ExLinksModule } from '../services/utils/ex-links.module';

import { SentenceModel } from '../services/model/sentence.model';
import {EngineManagerService} from '../providers/manager/engine-manager.service';
import engines from '../providers/manager/engines';
import {AboutComponent} from '../about/about.component';
import {SettingsComponent} from '../settings/settings.component';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  providers: [EngineManagerService]
})
export class MainComponent implements OnInit {
  sentences = [];  // new Array<SentenceModel>();
  cur_index = -1;

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
              private ems: EngineManagerService) {
  }

  reset(): void {
    this.cur_index = -1;
    this.sentences = [];
  }

  // ipcRenderer与ipcMain同步通信
  openFile(): void {
    const self = this;

    const options = {
      title: 'Open a Text File',
      filters: [
        { name: 'Text Files', extensions: ['txt', 'html', 'md', 'po'] }
      ]
    };

    dialog.showOpenDialog(options, (files) => {
      if (files) {
        self.reset();
      } else {
        return;
      }
      ipc.send('read-file', files);  // ('read-file', files, self);  进程之间不能传递对象
    });
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
      const state_element = $(`#state-${index}`);
      const sentence = this.sentences[index];
      if (sentence.refers.length === this.ems.getEnabledEngineCount()
        && !(state_element.attr('class') in ['warning circle icon', 'remove circle icon'])) {
        continue;
      }

      state_element.parent().removeClass('ez-hide');
      state_element.attr('class', 'spinner loading icon');
      this.translate(index, sentence);
    }
  }

  rerender(): void {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /*
  translate(sentence): void {
    this.googleTranslate.translate((<any>sentence).source, (result) => {
      (<any>sentence).target = result;
      this.rerender();
    });
  }
  */

  translate(index: number, sentence: SentenceModel): void {
    const state_element = $(`#state-${index}`);
    this.ems.translate(sentence.source).subscribe(
      res => {
        // TODO: 检查翻译结果和数量，更新翻译状态，翻译错误是显示在翻译按钮
        // TODO: 检查整体翻译进度，启用翻译按钮？？感觉做不到。。。
        if (res.target_text.length > 0) {
          sentence.target = 0;  // 显示最先返回的翻译结果
          state_element.attr('class', 'notched circle loading icon');
        } else {
          state_element.attr('class', 'warning circle icon');
        }

        let exist = false;
        for (let refer of sentence.refers) {
          if (res.engine_name === refer.engine_name) {
            refer = res;
            exist = true;
          }
        }
        if (!exist) {
          sentence.refers[sentence.refers.length] = res;
        }

        if (sentence.refers.length === this.ems.getEnabledEngineCount()) {
          if (!(state_element.attr('class') in ['warning circle icon', 'remove circle icon'])) {
            state_element.parent().toggleClass('ez-hide');
          }
        }
        this.rerender();
      },
      err => {
        console.log(err);  // TODO: 提供错误信息展示方案
        state_element.attr('class', 'remove circle icon');
        this.rerender();
      }
    );
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
      icon = 'icon';  // TODO: 手动点击翻译
    } else if (sentence.target === -1) {
      icon = 'user icon';
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
    // this.show(index);
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

    if (this.sentences[index].marked || index === this.cur_index) {
    } else {
      $(`#mark-${index}`).toggleClass('ez-hide');
    }
    // this.hide(index);
  }

  /*
  hide(index: number): void {
    $(`#exec-${index}`).toggleClass('ez-hide');
  }

  show(index: number): void {
    $(`#exec-${index}`).removeClass('ez-hide');
  }
  */

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
      tran_list.scrollTop = next_item.offsetTop - tran_list.clientHeight + next_item.clientHeight;

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
      tran_list.scrollTop = prev_item.offsetTop;

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
      const lines = data.split(/\n|\r\n/g);
      for (let line of lines) {
        line = line.trim();
        if (line) {
          self.sentences[self.sentences.length] = {
            source: line,
            target: -2,
            status: 0,
            marked: false,
            custom: null,
            refers: []  //  new Array<TranslateModel>()
          };
        }
      }
      self.title.setTitle(`Eztrans - ${filePath}`);
      self.rerender();
    });

    ipc.on('translate', (event) => {
      self.translate(self.cur_index, self.sentences[self.cur_index]);
    });

    // 安装外部链接
    ExLinksModule.applyExLinks();
  }

}
