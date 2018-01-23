/**
 * Document model
 */

import { SentenceModel } from './sentence.model';

// local_file: string;  本地文件
export class DocumentModel {
  doc_seqno: string;    // 文档序号
  doc_group: string;    // 分组标识
  doc_title: string;    // 文档名称
  doc_state: number;    // 文档状态
  orig_data: string;    // 原始数据
  create_time: string;  // 创建时间
  modify_time: string;  // 修改时间

  sentences: Array<SentenceModel>;  // 文档句段

  constructor(obj?: any) {
    this.doc_seqno = obj && obj.doc_seqno || '';
    this.doc_group = obj && obj.doc_group || '';
    this.doc_title = obj && obj.doc_title || '';
    this.doc_state = obj && obj.doc_state || 1;
    this.orig_data = obj && obj.orig_data || '';
    this.create_time = obj && obj.create_time || new Date().getTime();
    this.modify_time = obj && obj.modify_time || new Date().getTime();
  }
}
