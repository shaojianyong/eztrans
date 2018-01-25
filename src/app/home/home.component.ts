import { Component, OnInit } from '@angular/core';
const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;

import { DocumentModel } from '../services/model/document.model';
import { GroupModel } from '../services/model/group.model';


class DocGroup {
  id: string;
  name: string;
  documents: Array<DocumentModel>;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  doc_groups = [];
  cur_select = null;

  constructor() { }

  select(doc: DocumentModel): void {
    if (this.cur_select && this.cur_select.doc_seqno === doc.doc_seqno) {
      return;
    }

    if (this.cur_select) {
      $(`#doc-${this.cur_select.doc_seqno}`).toggleClass('selected_document');
    }
    $(`#doc-${doc.doc_seqno}`).toggleClass('selected_document');
    this.cur_select = doc;
  }

  onDocContextMenu(doc: DocumentModel): void {
    this.select(doc);
    const moveTo = [];
    for (const group of this.doc_groups) {
      if (group.doc_group.group_id !== doc.doc_group) {
        moveTo.push({
          group_id: group.doc_group.group_id,
          group_name: group.doc_group.group_name
        });
      }
    }
    ipc.send('show-doc-context-menu', moveTo);
  }

  onGroupContextMenu(group: GroupModel): void {

    ipc.send('show-group-context-menu');
  }

  loadDocGroups(): void {
    this.doc_groups = ipc.sendSync('load-doc-groups');
    if (this.doc_groups.length === 0) {
      this.doc_groups.push({
        id: '',  // 默认分组，不允许删除
        name: 'My Translations',
        documents: []
      });
    }

    /*
    this.doc_groups = [
      {
        doc_group: new GroupModel({
          group_id: '1',
          group_name: 'My Translations'
        }),
        documents: [
          new DocumentModel({
            doc_seqno: 'a',
            doc_group: '1',
            doc_title: 'hello.html',
          }),
          new DocumentModel({
            doc_seqno: 'b',
            doc_group: '1',
            doc_title: 'world.html'
          }),
          new DocumentModel({
            doc_seqno: 'c',
            doc_group: '1',
            doc_title: 'john.html'
          })]
      },
      {
        doc_group: new GroupModel({
          group_id: '2',
          group_name: 'My Translations2'
        }),
        documents: [
          new DocumentModel({
            doc_seqno: 'd',
            doc_group: '2',
            doc_title: 'hello.html'
          }),
          new DocumentModel({
            doc_seqno: 'e',
            doc_group: '2',
            doc_title: 'world.html'
          }),
          new DocumentModel({
            doc_seqno: 'f',
            doc_group: '2',
            doc_title: 'john.html',
            doc_state: 2
          })]
      }
    ];
    */
  }

  addDocument(): void {

  }

  updateDocGroup(): void {

  }

  saveDocGroups(): void {
    ipc.send('save-doc-groups', this.doc_groups);
  }

  ngOnInit() {
    $('.ui.accordion')
      .accordion();

    this.loadDocGroups();
  }

}
