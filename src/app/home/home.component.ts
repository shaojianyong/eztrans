import { Component, OnInit } from '@angular/core';
const moment = (<any>window).require('moment');
const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;

import { FunctionUtils } from '../services/utils/function-utils';
import { DocumentModel } from '../services/model/document.model';
import { GroupModel } from '../services/model/group.model';
import { DocInfoModel } from '../services/model/doc-info.model';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  doc_groups = [];
  cache_docs = {};
  cur_doc = null;  // DocInfoModel
  cur_select = null;

  constructor() { }

  getCurrentDoc(): DocumentModel {
    return this.cache_docs[this.cur_doc.id];
  }

  select(doc: DocInfoModel): void {
    if (this.cur_doc && this.cur_doc.id === doc.id) {
      return;
    }

    if (this.cur_doc) {
      $(`#doc-${this.cur_doc.id}`).toggleClass('selected_document');
    }
    $(`#doc-${doc.id}`).toggleClass('selected_document');
    this.cur_doc = doc;
  }

  openDoc(): void {

  }

  onDocContextMenu(doc: DocInfoModel): void {
    this.select(doc);
    const moveTo = [];
    for (const group of this.doc_groups) {
      if (group.id !== doc.group_id) {
        moveTo.push({
          id: group.id,
          name: group.name
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
      this.doc_groups.push(new GroupModel());
    }
  }

  addDocument(filePath: string): void {
    const mm = moment();
    const docId = mm.format('YYYYMMDDHHmmssSSS');

    this.cur_doc = new DocInfoModel({
      id: docId,
      name: FunctionUtils.getFileName(filePath),
      group_id: this.doc_groups[0].id,
      orig_file: filePath
    })
    this.doc_groups[0].documents.push(this.cur_doc);
    this.cache_docs[docId] = new DocumentModel({id: docId});
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

    ipc.on('doc-open', (event) => {
      this.openDoc();
    });
  }

}
