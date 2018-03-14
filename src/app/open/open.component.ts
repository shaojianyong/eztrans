import { Component, OnInit } from '@angular/core';
const {clipboard, remote} = (<any>window).require('electron');
const {dialog} = remote;

@Component({
  selector: 'app-open',
  templateUrl: './open.component.html',
  styleUrls: ['./open.component.css']
})
export class OpenComponent implements OnInit {
  docUrl = '';
  typeId = '';

  constructor() { }

  show(onApprove = null, onDeny = null): void {
    $('#open-dialog')
      .modal({
        closable: false,
        onDeny: onDeny ? onDeny : () => {},
        onApprove: onApprove ? onApprove : () => {}
      })
      .modal('show');
  }

  paste(inputBox: HTMLInputElement): void {
    const webPath = clipboard.readText();
    if (webPath.length > 9
      && (webPath.substr(0, 7).toLowerCase() === 'http://'
      || webPath.substr(0, 8).toLowerCase() === 'https://')) {
      inputBox.value = webPath;
    }
  }

  browse(inputBox: HTMLInputElement): void {
    const options = {
      title: 'Select a Structured Text File',
      filters: [
        {name: 'Text Files', extensions: ['epub', 'html', 'txt', 'md']}
      ]
    };
    dialog.showOpenDialog(options, (files) => {
      if (files) {
        inputBox.value = files[0];
      }
    });
  }

  onOK(): void {
    const activeTab = $('.ui.active.tab.segment');
    this.typeId = activeTab.attr('data-tab');
    this.docUrl = activeTab.find('input').val().toString();
  }

  getTypeId(): string {
    return this.typeId;
  }

  getDocUrl(): string {
    return this.docUrl;
  }

  ngOnInit() {
    $('.pt-tab-menu .menu .item')
      .tab({
        context: '.pt-tab-menu'
      });
  }

}
