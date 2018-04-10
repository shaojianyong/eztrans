import { SentenceModel } from './sentence.model';

// 文档模型
export class DocumentModel {
  id: string;  // 文档标识
  file_data: string;  // 文档原始数据
  data_type: string;  // 文档数据类型
  modified: boolean;  // 翻译修改标记
  sentences: Array<SentenceModel>;  // 文档句段

  constructor(obj?: any) {
    this.id = obj && obj.id || '';
    this.file_data = obj && obj.file_data || '';
    this.data_type = obj && obj.data_type || '';
    this.modified = obj && obj.modified || false;
    this.sentences = obj && obj.sentences || [];
  }
}
