/**
 * Group model
 */

export class GroupModel {
  group_id: string;     // 分组标识
  group_name: string;   // 分组名称
  group_state: number;  // 文档状态
  create_time: string;  // 创建时间
  modify_time: string;  // 修改时间

  constructor(obj?: any) {
    this.group_id = obj && obj.group_id || '';
    this.group_name = obj && obj.group_name || '';
    this.group_state = obj && obj.group_state || 1;
    this.create_time = obj && obj.create_time || new Date().getTime();
    this.modify_time = obj && obj.modify_time || new Date().getTime();
  }
}
