import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  select(event: MouseEvent): void {
    console.log(event);
    $('#my-row').css('background-color', 'gray');
  }

  ngOnInit() {
    $('.ui.accordion')
      .accordion();
  }

}
