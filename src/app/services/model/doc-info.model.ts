const moment = (<any>window).require('moment');

export class DocInfoModel {
  id: string;    // 文档标识
  name: string;  // 文档名称，可重命名
  orig_file: string;  // 原文档名称
  create_time: string;  // 创建时间
  modify_time: string;  // 修改时间

  constructor(obj?: any) {
    this.id = obj && obj.id || '';
    this.name = obj && obj.name || '';
    this.orig_file = obj && obj.orig_file || '';
    this.create_time = obj && obj.create_time || moment().format('YYYY-MM-DD HH:mm:ss');
    this.modify_time = obj && obj.modify_time || this.create_time;
  }
}