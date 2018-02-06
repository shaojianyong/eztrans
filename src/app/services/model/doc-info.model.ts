const moment = (<any>window).require('moment');

// 文档信息
export class DocInfoModel {
  id: string;    // 文档标识
  name: string;  // 文档名称，可重命名
  file_path: string;  // 原文档全路径
  group_id: string;  // 所在组
  x_state: number;  // 0-正常状态 1-标记删除 2-彻底删除
  create_time: string;  // 创建时间
  modify_time: string;  // 修改时间

  constructor(obj?: any) {
    this.id = obj && obj.id || '';
    this.name = obj && obj.name || '';
    this.file_path = obj && obj.file_path || '';
    this.group_id = obj && obj.group_id || '';
    this.x_state = obj && obj.x_state || 0;
    this.create_time = obj && obj.create_time || moment().format('YYYY-MM-DD HH:mm:ss');
    this.modify_time = obj && obj.modify_time || this.create_time;
  }
}
