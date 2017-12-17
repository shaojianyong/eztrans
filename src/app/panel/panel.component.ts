import { Component, OnInit } from '@angular/core';

class TransResult {
  provider: string;
  src_lang: string;
  tgt_lang: string;
  src_text: string;
  tgt_text: string;
}

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelComponent implements OnInit {
  session = new Map<string, TransResult>();

  constructor() { }

  ngOnInit() {
  }

}
