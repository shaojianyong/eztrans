import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-msgbox',
  templateUrl: './msgbox.component.html',
  styleUrls: ['./msgbox.component.css']
})
export class MsgboxComponent implements OnInit {
  msg_type = 0;  // 0-question/1-info/2-warning/3-error
  msg_head = '';
  msg_body = '';

  constructor(msg_type: number, msg_head: string, msg_body: string) {
    this.msg_type = msg_type;
    this.msg_head = msg_head;
    this.msg_body = msg_body;
  }

  show(): void {
    $('#message-box').modal('show');
  }

  ngOnInit() {
  }

}
