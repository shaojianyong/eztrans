import {Component, OnInit } from '@angular/core';

const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;
const dialog = electron.remote.dialog;

import { ExLinksModule } from '../../assets/ex-links';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  sentences = new Array<Object>();

  static onFileRead(event, err, data, userData): void {
    // userData.sentences = [];
    const lines = data.split(/\n|\r\n/g);
    for (let line of lines) {
      line = line.trim();
      if (line) {
        console.log(`${userData.sentences.length}: ${line}`);
        userData.sentences[userData.sentences.length] = { source: line, target: '' };
      }
    }
    // userData.cdr.markForCheck();
    // userData.myTest();
  }

  constructor() {

  }

  openFile(): void {
    dialog.showOpenDialog((files) => {
      ipc.send('read-file', files, this);
    });
  }

  myTest(): void {
    this.sentences[this.sentences.length] = { source: 'No.' + this.sentences.length,
      target: 'No:' + this.sentences.length };

  }

  ngOnInit() {
    ipc.on('file-read', MainComponent.onFileRead);

    ExLinksModule.applyExLinks();
  }

}
