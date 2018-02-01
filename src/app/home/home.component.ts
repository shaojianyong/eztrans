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
  sel_doc: DocInfoModel = null;
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
    }

    this.cur_doc = this.cache_docs[this.sel_doc.id];
    this.title.setTitle(`Eztrans - ${this.sel_doc.orig_file}`);  // TODO: 展示分组和文件名
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: true});
  }

  renameDoc(): void {
    console.log('renameDoc');
    const doc_name = $(`#doc-${this.sel_doc.id}>td.doc-name`);
    doc_name.attr('contenteditable', 'true');
    doc_name.focus();
  }

  endDocRename(event: KeyboardEvent): void {
    console.log('endDocRename');
    const doc_name = $(`#doc-${this.sel_doc.id}>td.doc-name`);
    doc_name.attr('contenteditable', 'false');
    this.sel_doc.name = doc_name.text();

    event.preventDefault();
    this.modified_flag = true;
  }

  removeDoc(): void {
    this.sel_doc.x_state = 1;  // 标记删除，实现逻辑：切换到已删除分组
    if (this.sel_doc.id === this.cur_doc.id) {
      this.cur_doc = new DocumentModel();  // 指向一个空文档
      this.title.setTitle('Eztrans');
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: true});
    } else {
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    }
    this.modified_flag = true;
  }

  moveUpDoc(): void {
    const group = this.getCurSelGroup();
    const index = group.documents.indexOf(this.sel_doc);
    if (index > 0) {
      const temp = group.documents[index];
      group.documents[index] = group.documents[index - 1];
      group.documents[index - 1] = temp;

      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    }
  }

  moveDownDoc(): void {
    const group = this.getCurSelGroup();
    const index = group.documents.indexOf(this.sel_doc);
    if (index < group.documents.length - 1) {
      const temp = group.documents[index];
      group.documents[index] = group.documents[index + 1];
      group.documents[index + 1] = temp;

      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    }

  }

  moveTo(group_id: string): void {
    let toGroup = null;
    const frGroup = this.getCurSelGroup();
    const index = frGroup.documents.indexOf(this.sel_doc);
    for (const group of this.doc_groups) {
      if (group.id === group_id) {
        toGroup = group;
        break;
      }
    }

    toGroup.documents.push(this.sel_doc);
    frGroup.documents.splice(index, 1);
    this.sel_doc.group_id = toGroup.id;

    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    this.modified_flag = true;
  }

  getCurSelGroup(): GroupModel {
    let res = null;
    for (const group of this.doc_groups) {
      if (group.id === this.sel_doc.group_id) {
        res = group;
        break;
      }
    }
    return res;
  }

  restoreDoc(): void {
    this.sel_doc.x_state = 0;
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    this.modified_flag = true;
  }

  getNormalDocs(group: GroupModel): Array<DocInfoModel> {
    const res = [];
    for (const doc of group.documents) {
      if (doc.x_state === 0) {
        res.push(doc);
      }
    }
    return res;
  }

  getRemovedDocs(): Array<DocInfoModel> {
    const res = [];
    for (const group of this.doc_groups) {
      for (const doc of group.documents) {
        if (doc.x_state === 1) {
          res.push(doc);
        }
      }
    }
    return res;
  }

  onDocContextMenu(doc: DocInfoModel, group: GroupModel): void {
    this.select(doc);
    ipc.send('show-doc-context-menu', group, this.doc_groups);
  }

  onGroupContextMenu(group: GroupModel): void {
    ipc.send('show-group-context-menu');
  }

  onRecycleBinContextMenu(): void {
    ipc.send('show-recycle-bin-context-menu');
  }

  onRecycleDocContextMenu(doc: DocInfoModel): void {
    this.select(doc);
    ipc.send('show-recycle-doc-context-menu');
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

    const docId = 'd' + moment().format('YYYYMMDDHHmmssSSS');
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

  addGroup(): void {
    const ts = moment().format('YYYYMMDDHHmmssSSS');
    this.doc_groups.push(new GroupModel({
      id: 'g' + ts,
      name: 'Group-' + ts.substr(2)
    }));

    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    this.modified_flag = true;
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

    ipc.on('doc-rename', (event) => {
      this.renameDoc();
    });

    ipc.on('doc-remove', (event) => {
      this.removeDoc();
    });

    ipc.on('doc-move-up', (event) => {
      this.moveUpDoc();
    });

    ipc.on('doc-move-down', (event) => {
      this.moveDownDoc();
    });

    ipc.on('doc-move-to', (event, group_id) => {
      this.moveTo(group_id);
    });

    ipc.on('empty-recycle-bin', (event) => {
      console.log('empty-recycle-bin');
    });

    ipc.on('doc-restore', (event) => {
      this.restoreDoc();
    });

    ipc.on('doc-delete', (event) => {
      console.log('doc-delete');
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
