import {Component, OnInit} from '@angular/core';
const { ipcRenderer } = (<any>window).require('electron');
import { ExLinksModule } from '../../assets/ex-links';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  constructor() {
  }

  openFile(): void {
    console.log('Open File ...');
    ipcRenderer.send('read-file');

    /*
    const selectDirBtn = document.getElementById('select-directory');

    selectDirBtn.addEventListener('click', function (event) {
      ipc.send('open-file-dialog');
    });

    ipc.on('selected-directory', function (event, path) {
      document.getElementById('selected-file').innerHTML = `You selected: ${path}`;
    });
    */
  }

  ngOnInit() {
    ExLinksModule.applyExLinks();
  }

}
