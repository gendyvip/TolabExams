import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartTypeRegistry, DoughnutControllerChartOptions } from 'chart.js';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import {
  DataService,
  StudentExamResult,
  StudentDashboardStats,
  CategoryPerformance,
  ExamData,
} from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ExamService } from '../../services/exam.service';
import { ExamCountService } from '../../services/exam-count.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('performanceChart') performanceChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartCanvas!: ElementRef<HTMLCanvasElement>;

  isLoading = true;
  hasError = false;
  errorMessage = '';
  currentUser: any = null;
  studentName: string = 'Student';
  averageScore: number = 0;
  noPerformanceData = false;
  noCategoryData = false;
  stats: StudentDashboardStats = {
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    passRate: 0,
    totalQuestions: 0,
    correctAnswers: 0,
  };

  recentResults: StudentExamResult[] = [];

  private performanceChart: Chart | null = null;
  private categoryChart: Chart | null = null;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private examService: ExamService,
    private examCountService: ExamCountService,
    private cdr: ChangeDetectorRef,
    private titleService: Title,
    private metaService: Meta
  ) {
    this.initializeUserInfo();
  }

  ngOnInit() {
    // Set title and meta tags
    this.titleService.setTitle(`Student Dashboard`);
    this.metaService.updateTag({ name: 'description', content: 'Student dashboard showing exam performance, statistics, and recent results' });
    this.metaService.updateTag({ name: 'keywords', content: 'student dashboard, exam results, performance statistics, education platform' });

    this.loadDashboardData();
    this.loadExamsForCount();
  }

  ngAfterViewInit() {
    this.initializeCharts();
  }

  private initializeUserInfo(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser && this.currentUser.name) {
      this.studentName = this.currentUser.name;
    }
    console.log('Current user:', this.currentUser);
    console.log('Teacher name:', this.studentName);
  }

  ngOnDestroy() {
    this.performanceChart?.destroy();
    this.categoryChart?.destroy();
  }

  private loadExamsForCount(): void {
    // Fetch exams for the student exam count in the sidebar
    this.examService.getAllExamsForStudent().subscribe(exams => {
      this.examCountService.updateStudentExamCount(exams ?? []);
    });
  }

  // Add missing methods that the template calls
  refreshData() {
    this.isLoading = true;
    this.hasError = false;

    this.destroyCharts().then(() => {
      Promise.all([
        this.loadStats(),
        this.loadRecentResults(),
      ])
        .then(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.initializeCharts();
        })
        .catch((error) => {
          console.error('Error refreshing dashboard data:', error);
          this.hasError = true;
          this.errorMessage = 'Failed to refresh dashboard data. Please try again.';
          this.isLoading = false;
        });
    });
  }

  retryLoadData() {
    this.refreshData();
  }

  calculateAccuracy(): number {
    if (this.stats.totalQuestions === 0) return 0;
    return Math.round(
      (this.stats.correctAnswers / this.stats.totalQuestions) * 100
    );
  }

  trackByResultId(index: number, result: StudentExamResult): any {
    return result.id || index;
  }

  private loadDashboardData() {
    this.isLoading = true;
    this.hasError = false;

    Promise.all([
      this.loadStats(),
      this.loadRecentResults(),
    ])
      .then(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.initializeCharts();
      })
      .catch((error) => {
        console.error('Error loading dashboard data:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load dashboard data. Please try again.';
        this.isLoading = false;
      });
  }

  private async loadStats(): Promise<void> {
    try {
      const stats = await this.dataService
        .getStudentDashboardStats()
        .toPromise();
      this.stats = stats ?? this.stats;
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  }

  private async loadRecentResults(): Promise<void> {
    try {
      const results = await this.dataService
        .getStudentRecentResults(5)
        .toPromise();
      this.recentResults = results ?? [];
    } catch (error) {
      console.error('Error loading recent results:', error);
      throw error;
    }
  }

  private async destroyCharts() {
    try {
      if (this.performanceChart) {
        this.performanceChart.destroy();
        this.performanceChart = null;
      }
      if (this.categoryChart) {
        this.categoryChart.destroy();
        this.categoryChart = null;
      }
    } catch (error) {
      console.error('Error destroying charts:', error);
    }
  }

  private async initializeCharts() {
    try {
      if (!this.performanceChartCanvas?.nativeElement || !this.categoryChartCanvas?.nativeElement) {
        return;
      }
      await this.initializeScoreDistributionChart();
      await this.initializeCategoryChart();
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }

  private async initializeScoreDistributionChart() {
    if (!this.performanceChartCanvas?.nativeElement) return;

    try {
      // Always destroy the previous chart instance if it exists
      if (this.performanceChart) {
        this.performanceChart.destroy();
        this.performanceChart = null;
      }

      const distribution = await this.dataService
        .getStudentScoreDistribution()
        .toPromise();
      const data = distribution ?? [0, 0, 0, 0, 0];
      const total = data.reduce((a, b) => a + b, 0);

      // If there's no data, set the flag and return
      if (total === 0) {
        this.noPerformanceData = true;
        return;
      }

      this.noPerformanceData = false;
      // Ensure the canvas is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
          datasets: [
            {
              data: data,
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(234, 179, 8, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(16, 185, 129, 0.8)',
              ],
              borderColor: [
                'rgb(239, 68, 68)',
                'rgb(245, 158, 11)',
                'rgb(234, 179, 8)',
                'rgb(34, 197, 94)',
                'rgb(16, 185, 129)',
              ],
              borderWidth: 2,
              hoverOffset: 15,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                font: { size: 12 },
                usePointStyle: true,
                pointStyle: 'rectRounded',
              },
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleColor: '#fff',
              titleFont: { size: 14, weight: 'bold' },
              bodyColor: '#fff',
              bodyFont: { size: 13 },
              callbacks: {
                label: (context) => {
                  const value = context.raw as number;
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${value} exams (${percentage}%)`;
                },
              },
            },
          },
          animation: {
            duration: 1000,
          },
        },
      };

      this.performanceChart = new Chart(this.performanceChartCanvas.nativeElement, config);
    } catch (error) {
      console.error('Error creating score distribution chart:', error);
    }
  }

  private async initializeCategoryChart() {
    if (!this.categoryChartCanvas?.nativeElement) return;

    try {
      // Always destroy the previous chart instance if it exists
      if (this.categoryChart) {
        this.categoryChart.destroy();
        this.categoryChart = null;
      }

      const categoryScores: CategoryPerformance | undefined =
        await this.dataService.getStudentCategoryPerformance().toPromise();

      const labels = Object.keys(categoryScores ?? {});
      const data = Object.values(categoryScores ?? {});

      // If there's no data, set the flag and return
      if (labels.length === 0 || data.length === 0) {
        this.noCategoryData = true;
        return;
      }

      this.noCategoryData = false;
      const colors = this.generateColors(labels.length);

      // Ensure the canvas is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Average Score',
              data: data,
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: 'Average Score' },
            },
            x: { title: { display: true, text: 'Category' } },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleColor: '#fff',
              titleFont: { size: 14, weight: 'bold' },
              bodyColor: '#fff',
              bodyFont: { size: 13 },
              callbacks: {
                label: (context) => {
                  return `${context.dataset.label}: ${context.raw}%`;
                },
              },
            },
          },
          animation: {
            duration: 1000,
          },
        },
      };

      this.categoryChart = new Chart(this.categoryChartCanvas.nativeElement, config);
    } catch (error) {
      console.error('Error creating category chart:', error);
    }
  }

  private generateColors(count: number): {
    background: string[];
    border: string[];
  } {
    const palette = [
      '#A78BFA', // purple-400
      '#818CF8', // indigo-400
      '#60A5FA', // blue-400
      '#4ADE80', // green-400
      '#FACC15', // yellow-400
      '#FB923C', // orange-400
      '#F87171', // red-400
    ];

    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    for (let i = 0; i < count; i++) {
      const color = palette[i % palette.length];
      backgroundColors.push(`${color.slice(0, 7)}D9`); // Add 80% opacity
      borderColors.push(color);
    }

    return { background: backgroundColors, border: borderColors };
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString; // Return original string if parsing fails
    }
  }
}
