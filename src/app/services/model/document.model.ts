import { SentenceModel } from './sentence.model';

// local_file: string;  本地文件
export class DocumentModel {
  id: string;  // 文档标识
  file_data: string;  // 文档原始数据
  data_type: string;  // 文档数据类型
  sentences: Array<SentenceModel>;  // 文档句段

  constructor(obj?: any) {
    this.id = obj && obj.id || '';
    this.file_data = obj && obj.file_data || '';
    this.data_type = obj && obj.data_type || '';
    this.sentences = obj && obj.sentences || [];
  }
}
