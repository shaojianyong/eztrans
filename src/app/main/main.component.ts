import {Component, OnInit, ReflectiveInjector } from '@angular/core';

const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;
const dialog = electron.remote.dialog;
const BrowserWindow = electron.remote.BrowserWindow;

import { ExLinksModule } from '../../assets/ex-links';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  sentences = new Array<Object>();

  static onFileRead(event, err, data, userData): void {
    /*userData.sentences = [];
    const lines = data.split(/\n|\r\n/g);
    for (let line of lines) {
      line = line.trim();
      if (line) {
        console.log(`${mc.sentences.length}: ${line}`);
        mc.sentences[mc.sentences.length] = { source: line, target: '' };
      }
    }*/
  }

  constructor() {
  }

  openFile(): void {
    dialog.showOpenDialog((files) => {
      const data = ipc.sendSync('read-file', files);
      const lines = data.split(/\n|\r\n/g);
      for (let line of lines) {
        line = line.trim();
        if (line) {
          console.log(`${this.sentences.length}: ${line}`);
          this.sentences[this.sentences.length] = { source: line, target: '' };
        }
      }
    });
  }

  myTest(): void {
  }

  ngOnInit() {
    ipc.on('file-read', MainComponent.onFileRead);

    ExLinksModule.applyExLinks();
  }

}
