import { Component, OnInit, Input } from '@angular/core';
import {StatisticsModel} from '../services/model/statistics.model';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  @Input() stats: StatisticsModel;

  constructor() { }

  ngOnInit() {
  }

}
