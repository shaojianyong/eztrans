import {Component, OnInit} from '@angular/core';
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

  // sentences: Array<Object>;

  // bad method
  static appendRow(source: string, target: string): void {
    const tab = (<any>document).getElementById('trans_table');
    const row = tab.insertRow(-1);
    const col1 = row.insertCell(0);
    const col2 = row.insertCell(1);
    col1.innerHTML = source;
    col2.innerHTML = target;
  }

  static onFileRead(event, err, data): void {
    const tab = (<any>document).getElementById('trans_table');
    tab
    // MainComponent.sentences = new Array<Object>();
    const lines = data.split(/\n|\r\n/g);
    // let index = 0;
    for (let line of lines) {
      line = line.trim();
      if (line) {
        // MainComponent.sentences[index] = { source: line, target: '' };
        // index++;
        MainComponent.appendRow(line, '');
      }
    }
  }

  constructor() {
    // this.sentences = new Array<Object>();
    // this.sentences[0] = { source: 'hello', target: 'world!' };
    // this.sentences[1] = { source: 'hello1', target: 'world!1' };
  }

  openFile(): void {
    dialog.showOpenDialog((files) => {
      ipc.send('read-file', files);
    });
  }

  ngOnInit() {
    ipc.on('file-read', MainComponent.onFileRead);

    ExLinksModule.applyExLinks();
  }

}
