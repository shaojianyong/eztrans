import { Component, OnInit } from '@angular/core';
import languages from './languages';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  langs = languages;

  constructor() { }

  ngOnInit() {
  }

}
