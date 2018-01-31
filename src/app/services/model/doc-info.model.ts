const moment = (<any>window).require('moment');

export class DocInfoModel {
  id: string;    // 文档标识
  name: string;  // 文档名称，可重命名
  group_id: string;  // 所在组
  orig_file: string;  // 原文档名称
  state: number;  // 0-初始状态 1-翻译中 2-翻译完成 3-标记删除 4-彻底删除
  create_time: string;  // 创建时间
  modify_time: string;  // 修改时间

  constructor(obj?: any) {
    this.id = obj && obj.id || '';
    this.name = obj && obj.name || '';
    this.group_id = obj && obj.group_id || '';
    this.orig_file = obj && obj.orig_file || '';
    this.state = obj && obj.state || 0;
    this.create_time = obj && obj.create_time || moment().format('YYYY-MM-DD HH:mm:ss');
    this.modify_time = obj && obj.modify_time || this.create_time;
  }
}
