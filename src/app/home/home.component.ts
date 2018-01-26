import { Component, OnInit } from '@angular/core';
const moment = (<any>window).require('moment');
const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;

import { FunctionUtils } from '../services/utils/function-utils';
import { DocumentModel } from '../services/model/document.model';
import { GroupModel } from '../services/model/group.model';


class Document {
  id: string;
  sentences: Array<SentenceModel>;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  doc_groups = [];
  cache_docs = {};
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

  loadDocGroups(docGroups: any): void {
    if (docGroups && docGroups.length) {
      this.doc_groups = docGroups;
    } else {
      this.doc_groups.push({
        id: '',  // 默认分组，不允许删除
        name: 'My Translations',
        documents: []
      });
    }
  }

  addDocument(filePath: string): void {
    const mm = moment();
    const docId = 'doc-' + mm.format('YYYYMMDDHHmmssSSS');

    this.doc_groups[0].documents.push({
      id: docId,
      name: FunctionUtils.getFileName(filePath),
      orig_file: filePath,
      create_time: mm.format('YYYY-MM-DD HH:mm:ss'),
      modify_time: mm.format('YYYY-MM-DD HH:mm:ss')
    });
  }

  updateDocGroup(): void {

  }

  saveDocGroups(): void {
    ipc.send('save-doc-groups', this.doc_groups);
  }

  ngOnInit() {
    $('.ui.accordion')
      .accordion();

    ipc.send('req-doc-groups');

    ipc.on('rsp-doc-groups', (event, data) => {
      this.loadDocGroups(data);
    });
  }

}
