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

  source_text = 'Hello World!';
  sentences = new Array<Object>();

  static onFileRead(event, err, data, userData): void {


    console.log(userData);
    console.log(`2 ==> ${mc instanceof MainComponent}`);
    // userData.sentences = [];
    /*const lines = data.split(/\n|\r\n/g);
    for (let line of lines) {
      line = line.trim();
      if (line) {
        console.log(`${mc.sentences.length}: ${line}`);
        mc.sentences[mc.sentences.length] = { source: line, target: '' };
      }
    }*/
    // userData.cdr.markForCheck();
    // userData.myTest();
  }

  constructor() {
  }

  openFile(): void {
    dialog.showOpenDialog((files) => {
      console.log(`1 ==> ${this instanceof MainComponent}`);
      ipc.send('read-file', files, 0);
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
