import { SentenceModel } from './sentence.model';

// local_file: string;  本地文件
export class DocumentModel {
  id: string;  // 文档标识
  sentences: Array<SentenceModel>;  // 文档句段

  constructor(obj?: any) {
    this.id = obj && obj.id || '';
    this.sentences = obj && obj.sentences || [];
  }
}
