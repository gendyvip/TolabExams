import { Component, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  AdminService,
  DashboardStats,
  ExamResult,
  RecentResult,
} from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ExamService } from '../../../services/exam.service';
import { ExamCountService } from '../../../services/exam-count.service';
import { Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

Chart.register(...registerables);

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: any = null;
  teacherName: string = 'Admin';
  dashboardStats: DashboardStats = {
    totalStudents: 0,
    totalExams: 0,
    totalQuestions: 0,
    overallPassRate: 0,
  };

  examResults: ExamResult[] = [];
  recentResults: RecentResult[] = [];

  loading = true;
  error: string | null = null;
  noResultsData = false;
  noActivityData = false;

  private resultsChart: Chart | null = null;
  private activityChart: Chart | null = null;
  private dataLoaded = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private examService: ExamService,
    private examCountService: ExamCountService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {
    this.initializeUserInfo();
  }

  ngOnInit(): void {
    this.titleService.setTitle(`Teacher Dashboard`);
    this.metaService.updateTag({
      name: 'description',
      content: 'Teacher dashboard for managing exams, monitoring student performance, and tracking overall platform statistics. View detailed analytics and recent exam results.'
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: 'teacher dashboard, exam management, student performance, platform statistics, exam analytics, teacher controls'
    });

    this.loadDashboardData();
    this.loadExamsForCount();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private initializeUserInfo(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser && this.currentUser.name) {
      this.teacherName = this.currentUser.name;
    }
    console.log('Current user:', this.currentUser);
    console.log('Teacher name:', this.teacherName);
  }

  private loadExamsForCount(): void {
    this.examService.getAllExamsForTeacher().subscribe(exams => {
      this.examCountService.updateAdminExamCount(exams?.length ?? 0);
    });
  }

  private destroyCharts(): void {
    if (this.resultsChart) {
      try {
        this.resultsChart.destroy();
      } catch (error) {
        console.warn('Error destroying results chart:', error);
      }
      this.resultsChart = null;
    }

    if (this.activityChart) {
      try {
        this.activityChart.destroy();
      } catch (error) {
        console.warn('Error destroying activity chart:', error);
      }
      this.activityChart = null;
    }
  }

  private loadDashboardData(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;
    this.dataLoaded = false;

    forkJoin({
      stats: this.adminService.getDashboardStats(currentUser.id),
      examResults: this.adminService.getExamResults(),
      recentResults: this.adminService.getRecentResults(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const result = data.stats.data;
          const stats = (result as any).data ? (result as any).data : result;
          this.dashboardStats = stats ?? this.dashboardStats;
          this.examResults = data.examResults;
          this.recentResults = data.recentResults.data;
          this.loading = false;
          this.dataLoaded = true;
          this.cdr.detectChanges();
          this.initializeCharts();
        },
        error: (error) => {
          this.error = 'Failed to load dashboard data';
          this.loading = false;
          this.dataLoaded = false;
        },
      });
  }

  private initializeCharts(): void {
    this.destroyCharts();
    const resultsCanvas = document.getElementById('resultsChart') as HTMLCanvasElement;
    const activityCanvas = document.getElementById('activityChart') as HTMLCanvasElement;

    if (!resultsCanvas || !activityCanvas) {
      console.warn('Chart canvas not found.');
      return;
    }

    if (!this.dataLoaded || this.loading) {
      return;
    }
    const hasStudentActivity = this.dashboardStats.totalStudents > 0 && this.recentResults.length > 0;

    const examTitles = this.examResults.map(exam => exam.exam.title);
    const totalAttempts = this.examResults.map(exam => exam.totalAttempts);
    const overallPassRate = this.dashboardStats?.overallPassRate || 0;
    const overallFailRate = 100 - overallPassRate;

    if (!hasStudentActivity) {
      this.noResultsData = true;
      this.noActivityData = true;
      return;
    }

    if (overallPassRate === 0 && overallFailRate === 0) {
      this.noResultsData = true;
    } else {
      this.noResultsData = false;
      this.resultsChart = new Chart(resultsCanvas, {
        type: 'pie',
        data: {
          labels: ['Passed', 'Failed'],
          datasets: [
            {
              data: [overallPassRate, overallFailRate],
              backgroundColor: ['#4CAF50', '#F44336'],
              borderColor: ['#ffffff', '#ffffff'],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Overall Pass Rate' }
          },
        },
      });
    }

    if (examTitles.length === 0 || totalAttempts.every(attempt => attempt === 0)) {
      this.noActivityData = true;
    } else {
      this.noActivityData = false;
      this.activityChart = new Chart(activityCanvas, {
        type: 'bar',
        data: {
          labels: examTitles,
          datasets: [
            {
              label: 'Total Attempts',
              data: totalAttempts,
              backgroundColor: '#3F51B5',
              borderColor: '#3F51B5',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Number of Attempts' } },
            x: { title: { display: true, text: 'Exam Title' } }
          },
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Exam Attempts' }
          }
        },
      });
    }
  }

  get totalQuestions(): number {
    return this.dashboardStats?.totalQuestions || 0;
  }

  get averageScore(): number {
    return this.dashboardStats?.overallPassRate || 0;
  }

  get totalStudents(): number {
    return this.dashboardStats?.totalStudents || 0;
  }

  get displayPassRate(): number {
    return this.dashboardStats?.overallPassRate || 0;
  }

  get displayTotalQuestions(): number {
    return this.dashboardStats?.totalQuestions || 0;
  }

  refreshData(): void {
    this.loadDashboardData();
    this.loadExamsForCount();
  }

  trackByResultId(index: number, result: RecentResult): number {
    return result.id;
  }
}
