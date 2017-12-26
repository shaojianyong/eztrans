import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
const { shell } = (<any>window).require('electron');
import { SentenceModel } from '../services/model/sentence.model';
import { TranslateModel } from '../services/model/translate.model';
import engines from '../../assets/engines';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelComponent implements OnInit {
  @Input() sentence: SentenceModel;
  @Output() selectedChangeEvent = new EventEmitter<any>();

  constructor() {
  }

  select(refer_index: number): void {
    this.sentence.target = this.sentence.refers[refer_index].target_text;
    this.selectedChangeEvent.emit();
  }

  clone(refer_index: number): void {
    const orig = this.sentence.refers[refer_index];

    if (this.sentence.custom) {
      this.sentence.custom.engine_name = orig.engine_name;
      this.sentence.custom.source_lang = orig.source_lang;
      this.sentence.custom.target_lang = orig.target_lang;
      this.sentence.custom.source_text = orig.source_text;
      this.sentence.custom.target_text = orig.target_text;

    } else {
      const copy = new TranslateModel();
      copy.engine_name = orig.engine_name;
      copy.source_lang = orig.source_lang;
      copy.target_lang = orig.target_lang;
      copy.source_text = orig.source_text;
      copy.target_text = orig.target_text;
      this.sentence.custom = copy;
    }

    this.selectedChangeEvent.emit();
    $('#custom-editor').text(this.sentence.custom.target_text);
    $('#custom-editor').attr('contenteditable', 'true');
    $('#custom-editor').focus();
  }

  onExLink(engine_name: string): void {
    shell.openExternal(engines[engine_name].site);
  }

  getEngineIcon(engine_name: string): string {
    return engines[engine_name].icon;
  }

  getHeartIcon(refer_index: number): string {
    let heart = 'empty heart icon';
    if (this.sentence.target === this.sentence.refers[refer_index].target_text) {
      heart = 'heart icon';
    }
    return heart;
  }

  onEditorBlur(): void {
    $('#custom-editor').attr('contenteditable', 'false');
  }

  onEdit(): void {
    $('#custom-editor').attr('contenteditable', 'true');
    $('#custom-editor').focus();
    this.selectedChangeEvent.emit();
  }

  onSentenceChange(): void {
    $('#custom-editor').text(this.sentence.custom.target_text);
  }

  onEditInput(): void {
    console.log('onEditKeyDown');
    this.sentence.custom.target_text = $('#custom-editor').text();

    this.selectedChangeEvent.emit();
  }

  ngOnInit() {
  }

}
