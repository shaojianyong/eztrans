import { DocInfoModel } from './doc-info.model';

// 文档分组
export class CollectModel {
  id: string;     // 分组标识
  name: string;   // 分组名称
  documents: Array<DocInfoModel>;  // 组内文档

  constructor(obj?: any) {
    this.id = obj && obj.id || 'my-translations';
    this.name = obj && obj.name || 'My Translations';
    this.documents = obj && obj.documents || [];
  }
}

export class GroupModel extends CollectModel {

}

export class BookModel extends CollectModel {

}
