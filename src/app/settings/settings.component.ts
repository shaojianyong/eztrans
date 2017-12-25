import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  constructor() { }

  show(): void {
    $('#settings-dialog').modal('show');
  }

  test(): void {
    $('.ui.accordion').accordion('refresh');
  }

  ngOnInit() {
  }

}
