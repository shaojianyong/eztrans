import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {Title} from '@angular/platform-browser';
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
  @Output() rerenderEvent = new EventEmitter<any>();

  doc_groups = [];
  cache_docs = {};
  sel_doc = null;  // DocInfoModel
  cur_doc = new DocumentModel();  // 指向一个空文档
  modified_flag = false;

  constructor(private title: Title) { }


  select(doc: DocInfoModel): void {
    if (this.sel_doc && this.sel_doc.id === doc.id) {
      return;
    }

    if (this.sel_doc) {
      $(`#doc-${this.sel_doc.id}`).toggleClass('selected_document');
    }
    $(`#doc-${doc.id}`).toggleClass('selected_document');
    this.sel_doc = doc;
  }

  // 切换当前打开文档前，要先保存
  openDoc(): void {
    if (this.cur_doc.id === this.sel_doc.id) {
      return;
    }

    if (!(this.sel_doc.id in this.cache_docs)) {
      const doc = ipc.sendSync('req-document', this.sel_doc.id);
      this.cache_docs[this.sel_doc.id] = doc;
    }

    if (this.cur_doc && this.cur_doc.id) {
      this.saveCurDocument(false);
      console.log('Save current document before switch!');
    }

    this.cur_doc = this.cache_docs[this.sel_doc.id];
    this.title.setTitle(`Eztrans - ${this.sel_doc.orig_file}`);  // TODO: 展示分组和文件名
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: true});
  }

  deleteDoc(): void {
    this.sel_doc.state = 3;  // 标记删除，实现逻辑：切换到已删除分组
    if (this.sel_doc.id === this.cur_doc.id) {
      this.cur_doc = new DocumentModel();  // 指向一个空文档
      this.title.setTitle('Eztrans');
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: true});
    } else {
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    }
    this.modified_flag = true;
  }

  getNormalDocs(group: GroupModel) {
    const res = [];
    for (const doc of group.documents) {
      if (doc.state < 3) {
        res.push(doc);
      }
    }
    return res;
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

  addDocument(filePath: string): boolean {
    const doc = this.findDocInfo(filePath);
    if (doc) {
      ipc.send('doc-repeat-inquiry', doc);
      return false;
    }

    const mm = moment();
    const docId = mm.format('YYYYMMDDHHmmssSSS');

    this.sel_doc = new DocInfoModel({
      id: docId,
      name: FunctionUtils.getFileName(filePath),
      group_id: this.doc_groups[0].id,
      orig_file: filePath
    });
    this.doc_groups[0].documents.push(this.sel_doc);

    this.cur_doc = new DocumentModel({id: docId});
    this.cache_docs[docId] = this.cur_doc;
    this.title.setTitle(`Eztrans - ${filePath}`);
    this.modified_flag = true;
    return true;
  }

  findDocInfo(filePath: string): DocInfoModel {
    let res = null;
    for (const group of this.doc_groups) {
      for (const doc of group.documents) {
        if (doc.orig_file.toLowerCase() === filePath.toLowerCase()) {
          res = doc;
        }
      }
    }
    return res;
  }

  // save current document
  saveCurDocument(sync: boolean) {
    if (this.cur_doc.id) {
      if (sync) {
        ipc.sendSync('save-document', {
          data: this.cur_doc,
          sync: true
        });
      } else {
        ipc.send('save-document', {
          data: this.cur_doc,
          sync: false
        });
      }
    }
  }

  // save doc-groups
  saveDocGroups(sync: boolean): void {
    if (this.modified_flag) {
      if (sync) {
        const res = ipc.sendSync('save-doc-groups', {
          data: this.doc_groups,
          sync: true
        });
        if (res === 'ok') {
          this.modified_flag = false;
        }
      } else {
        ipc.send('save-doc-groups', {
          data: this.doc_groups,
          sync: false
        });
        this.modified_flag = false;
      }
    }
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

    ipc.on('doc-delete', (event) => {
      this.deleteDoc();
    });

    ipc.on('doc-repeat-reply', (event, index, doc) => {
      if (index === 0) {  // yes
        this.select(doc);
        this.openDoc();
      }
    });

    // auto save all user data
    setInterval(() => {
      this.saveCurDocument(false);
      this.saveDocGroups(false);
    }, 1000 * 5);


    window.onbeforeunload = () => {
      this.saveCurDocument(true);
      this.saveDocGroups(true);
    };
  }

}
