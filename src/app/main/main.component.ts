import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';

const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;
const dialog = electron.remote.dialog;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const BrowserWindow = electron.remote.BrowserWindow;

import { ExLinksModule } from '../../assets/ex-links';

import { SentenceModel } from '../services/model/sentence.model';
import {EngineManagerService} from '../services/engine/engine-manager.service';
import engines from '../../assets/engines';
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
  default_engine = 'Google';
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
            custom: null,
            refers: []  // new Array<TranslateModel>()
          };
        }
      }
      self.title.setTitle(`Eztrans - ${files[0]}`);
      self.cdr.markForCheck();
      self.cdr.detectChanges();
    });
  }

  onItemClick(index, sentence): void {
    if (index === this.cur_index) {
      return;
    }

    if (this.cur_index !== -1) {
      // const table1 = document.getElementById(`table-${this.cur_index}`);
      // table1.classList.remove('inverted');
      $(`#item-${this.cur_index}`).css('background-color', 'white');
    }

    // const table2 = document.getElementById(`table-${index}`);
    // table2.classList.add('inverted');
    // lightcyan; palegreen; aliceblue; lightyellow; ghostwhite; azure
    $(`#item-${index}`).css('background-color', 'cornsilk');  // azure
    $(`#item-${index}`).attr('normal-background-color', 'cornsilk');

    this.cur_index = index;

    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onItemDblclick(index, sentence): void {
    this.translate(sentence);
  }

  onItemContextMenu(index, sentence): void {
    this.onItemClick(index, sentence);
    ipc.send('show-item-context-menu');
  }

  autoTranslate(): void {
    for (const sentence of this.sentences) {
      this.translate(sentence);
    }
  }

  onSelectedChange(): void {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /*
  translate(sentence): void {
    this.googleTranslate.translate((<any>sentence).source, (result) => {
      (<any>sentence).target = result;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }
  */

  translate(sentence: SentenceModel): void {
    if (sentence.refers.length > 0) {
      return;
    }

    this.ems.translate(sentence.source).subscribe(
      res => {
        if (this.default_engine === res.engine_name) {
          sentence.target = sentence.refers.length;
        }
        sentence.refers[sentence.refers.length] = res;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      err => {
        // sentence.target = err;  TODO: 提供错误信息展示方案
        this.cdr.markForCheck();
        this.cdr.detectChanges();
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
      icon = 'translate icon';  // TODO: 手动点击翻译
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
    if (index === this.cur_index) {
      return;
    }
    $(`#item-${index}`).attr('normal-background-color', $(`#item-${index}`).css('background-color'));
    $(`#item-${index}`).css('background-color', 'ghostwhite');  // ghostwhite, whitesmoke
  }

  onMouseLeave(index: number): void {
    if (index === this.cur_index) {
      return;
    }
    $(`#item-${index}`).css('background-color', $(`#item-${index}`).attr('normal-background-color'));
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
            custom: null,
            refers: []  //  new Array<TranslateModel>()
          };
        }
      }
      self.title.setTitle(`Eztrans - ${filePath}`);
      self.cdr.markForCheck();
      self.cdr.detectChanges();
    });

    ipc.on('translate', (event) => {
      self.translate(self.sentences[self.cur_index]);
    });

    // 安装外部链接
    ExLinksModule.applyExLinks();
  }

}
