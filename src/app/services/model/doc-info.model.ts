const moment = (<any>window).require('moment');

export const DocType = Object.freeze({
  ARTICLE: 'article',  // 独立文档
  CHAPTER: 'chapter'   // 书本章节
});

// 文档信息
export class DocInfoModel {
  id: string;    // 文档标识
  name: string;  // 文档名称，可重命名
  type: string;  // 文档类型：article, chapter
  file_path: string;  // 原文档全路径
  group_id: string;   // 所在组
  source_lang: string;  // 文档语言
  target_lang: string;  // 目标语言
  x_state: number;  // 0-正常状态 1-标记删除
  create_time: string;  // 创建时间
  modify_time: string;  // 修改时间

  constructor(obj?: any) {
    this.id = obj && obj.id || '';
    this.name = obj && obj.name || '';
    this.type = obj && obj.type || DocType.ARTICLE;
    this.file_path = obj && obj.file_path || '';
    this.group_id = obj && obj.group_id || '';
    this.source_lang = obj && obj.source_lang || 'auto';
    this.target_lang = obj && obj.target_lang || 'zh-cn';
    this.x_state = obj && obj.x_state || 0;
    this.create_time = obj && obj.create_time || moment().format('YYYY-MM-DD HH:mm:ss');
    this.modify_time = obj && obj.modify_time || this.create_time;
  }
}
