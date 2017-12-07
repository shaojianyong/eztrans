import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { Title } from '@angular/platform-browser';

const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;
const dialog = electron.remote.dialog;
const BrowserWindow = electron.remote.BrowserWindow;

import { GoogleTranslateService } from '../services/google/google-translate.service';
import { ExLinksModule } from '../../assets/ex-links';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  providers: [GoogleTranslateService]
})
export class MainComponent implements OnInit {
  sentences = new Array<Object>();
  cur_index = 0;

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
              private googleTranslate: GoogleTranslateService) {
  }

  reset(): void {
    this.cur_index = 0;
    this.sentences = [];
  }

  // ipcRenderer与ipcMain同步通信
  openFile(): void {
    const self = this;

    const options = {
      title: 'Open a Text File',
      filters: [
        { name: 'Text Files', extensions: ['txt'] }
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
          self.sentences[this.sentences.length] = { source: line, target: '' };
        }
      }
      self.title.setTitle(`Eztrans - ${files[0]}`);
      self.cdr.markForCheck();
      self.cdr.detectChanges();
    });
  }

  onItemSelected(index, sentence): void {
    const obj = document.getElementById(`item-${index}`);
    console.log(obj);
    // console.log(`Call myTest... ${index}: ${sentence.source}`);
  }

  onItemTranslate(index, sentence): void {
    this.translate(index);
  }

  nextTranslate(): void {
    if (this.cur_index === this.sentences.length) {
      return;
    }
    this.translate(this.cur_index);
    this.cur_index++;
  }

  autoTranslate(): void {
    for (this.cur_index; this.cur_index < this.sentences.length; this.cur_index++) {
      this.translate(this.cur_index);
    }
  }

  translate(index: number): void {
    const sentence = this.sentences[index];
    this.googleTranslate.translate((<any>sentence).source, (result) => {
      (<any>sentence).target = result;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
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
          self.sentences[self.sentences.length] = { source: line, target: '' };
        }
      }
      self.title.setTitle(`Eztrans - ${filePath}`);
      self.cdr.markForCheck();
      self.cdr.detectChanges();
    });

    // 安装外部链接
    ExLinksModule.applyExLinks();
  }

}
