export class GroupModel {
  id: string;     // 分组标识
  name: string;   // 分组名称
  documents: Array<DocInfoModel>;  // 组内文档

  constructor(obj?: any) {
    this.id = obj && obj.id || '';
    this.name = obj && obj.name || '';
    this.documents = obj && obj.documents || [];
  }
}
