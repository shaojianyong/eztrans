import { DocInfoModel } from './doc-info.model';

export const GroupType = Object.freeze({
  CLIP: 'clip',  // 夹子
  BOOK: 'book'   // 书本
});

// 文档分组
export class GroupModel {
  id: string;     // 分组标识
  name: string;   // 分组名称
  type: string;   // 分组类型
  documents: Array<DocInfoModel>;  // 组内文档

  constructor(obj?: any) {
    this.id = obj && obj.id || 'my-translations';
    this.name = obj && obj.name || 'My Translations';
    this.type = obj && obj.type || GroupType.CLIP;
    this.documents = obj && obj.documents || [];
  }
}
