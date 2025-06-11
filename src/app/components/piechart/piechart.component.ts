import { Component, Input, OnChanges, ViewChild, ElementRef, SimpleChanges, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-piechart',
  templateUrl: './piechart.component.html',
  styleUrls: ['./piechart.component.css']
})
export class PiechartComponent implements AfterViewInit, OnChanges {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef;
  @Input() type: 'doughnut' | 'pie' = 'doughnut';
  @Input() data: number[] = [];
  @Input() labels: string[] = [];
  @Input() colors: string[] = [];

  private chart: any;
  private isViewInitialized = false;

  ngAfterViewInit() {
    this.isViewInitialized = true;
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.isViewInitialized) return;

    if (changes['type']) {
      this.recreateChart();
    } else if (this.chart) {
      this.updateChart();
    } else {
      this.initializeChart();
    }
  }

  private initializeChart() {
    if (!this.chartCanvas?.nativeElement) {
      console.warn('Chart canvas not available yet');
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    this.chart = new Chart(ctx, {
      type: this.type,
      data: {
        labels: this.labels,
        datasets: [{
          data: this.data,
          backgroundColor: this.colors.length ? this.colors : this.getDefaultColors(),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  private updateChart() {
    if (!this.chart) return;

    this.chart.data.labels = this.labels;
    this.chart.data.datasets[0].data = this.data;
    this.chart.data.datasets[0].backgroundColor = this.colors.length ? this.colors : this.getDefaultColors();
    this.chart.update();
  }

  private recreateChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.initializeChart();
  }

  private getDefaultColors(): string[] {
    return [
      '#FF6384', '#36A2EB', '#FFCE56',
      '#4BC0C0', '#9966FF', '#FF9F40',
      '#8AC24A', '#FF5722', '#607D8B'
    ];
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}