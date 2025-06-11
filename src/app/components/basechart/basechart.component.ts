import { Component, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-basechart',
  imports: [BaseChartDirective],
  templateUrl: './basechart.component.html',
  styleUrl: './basechart.component.css'
})
export class BasechartComponent implements OnInit {

  
    public lineChartType: ChartType = 'line';
  
    public lineChartData: ChartConfiguration['data'] = {
      datasets: [
        {
          data: [65, 59, 80, 81, 56, 55, 40],
          label: 'Result',
          backgroundColor: 'rgba(148,159,177,0.2)',
          borderColor: 'rgba(148,159,177,1)',
          pointBackgroundColor: 'rgba(148,159,177,1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(148,159,177,0.8)',
          fill: 'origin',
        }
      ],
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July']
    };
  
    public lineChartOptions: ChartConfiguration['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      elements: {
        line: {
          tension: 0.5
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: { display: false }
      }
    };
  
    ngOnInit() {
      Chart.register();
    }
}
