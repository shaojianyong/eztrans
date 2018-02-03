import { Component, OnInit, Input } from '@angular/core';


@Component({
  selector: 'app-msgbox',
  templateUrl: './msgbox.component.html',
  styleUrls: ['./msgbox.component.css']
})
export class MsgboxComponent implements OnInit {
  type = 0;  // 0-question 1-info 2-warning 3-error
  head = 'EZtrans';
  body = 'Are you sure you want to do this operation?';
  style = {
    approve: {text: 'Yes', color: 'red'},
    deny: {text: 'No', color: 'green'},
    close: {text: 'Close', color: ''}
  };

  constructor() {
  }

  setType(type: number) {
    this.type = type;
  }

  setHead(head: string) {
    this.head = head;
  }

  setBody(body: string) {
    this.body = body;
  }

  setButtonStyle(type: string, text: string, color: string) {
    this.style[type].text = text;
    this.style[type].color = color;
  }

  show(onApprove = null, onDeny = null): void {
    $('#message-box')
      .modal({
        closable: false,
        onDeny: onDeny ? onDeny : () => {},
        onApprove: onApprove ? onApprove : () => {}
      })
      .modal('show');
  }

  ngOnInit() {
  }

}
