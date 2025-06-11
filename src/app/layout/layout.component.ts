import { Component, Input, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NavbarComponent } from "../components/navbar/navbar.component";
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FocusModeService } from '../services/focus-mode.service';
import { AuthService } from '../services/auth.service';
import { DataService, ExamData, StudentDashboardStats } from '../services/data.service';
import { ExamCountService } from '../services/exam-count.service';
import { Subscription } from 'rxjs';
import { ExamService } from '../services/exam.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  togglerState: boolean = false
  focusMode: boolean = false;
  currentUser: any = null;
  user: string = '';
  showAlert = false;
  alertMessage = '';
  alertType = 'error';
  stats: StudentDashboardStats = {
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    passRate: 0,
    totalQuestions: 0,
    correctAnswers: 0,
  };
  private examCountSubscription?: Subscription;
  private adminExamCountSubscription?: Subscription;
  private studentExamCountSubscription?: Subscription;

  constructor(
    private focusModeService: FocusModeService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private dataService: DataService,
    private examCountService: ExamCountService,
    private examService: ExamService,
    private toastr: ToastrService
  ) {
    this.initializeUserInfo();
  }

  ngOnInit() {
    this.focusModeService.focusMode$.subscribe(mode => {
      this.focusMode = mode;
      this.cdr.detectChanges();
    });

    this.loadStats();

    // Subscribe to admin exam count
    this.adminExamCountSubscription = this.examCountService.adminExamCount$.subscribe(count => {
      if (this.currentUser?.role === 'teacher') {
        this.stats.totalExams = count;
        this.cdr.detectChanges();
      }
    });

    // Subscribe to student exam count
    this.studentExamCountSubscription = this.examCountService.studentExamCount$.subscribe(count => {
      if (this.currentUser?.role === 'student') {
        this.stats.totalExams = count;
        this.cdr.detectChanges();
      }
    });

    // Load exams for student count if user is a student
    if (this.currentUser?.role === 'student') {
      this.examService.getAllExamsForStudent().subscribe(exams => {
        this.examCountService.updateStudentExamCount(exams ?? []);
      });
    }
  }

  ngOnDestroy() {
    this.examCountSubscription?.unsubscribe();
    this.adminExamCountSubscription?.unsubscribe();
    this.studentExamCountSubscription?.unsubscribe();
  }


  private async loadStats(): Promise<void> {
    if (this.currentUser?.role === 'student') {
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
  }
  private initializeUserInfo(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser) {
      this.user = this.currentUser;
    }
  }

  onToggleState(state: boolean) {
    this.togglerState = state
    console.log(this.togglerState)
  }

  keydownListener = (event: KeyboardEvent) => {
    if (event.key === 'Tab' || event.key === 'F12' || event.ctrlKey || event.altKey || event.metaKey) {
      event.preventDefault();
      return false;
    }
    return true;
  };

  contextMenuListener = (event: MouseEvent) => {
    event.preventDefault();
    return false;
  };

  exitFullscreen(): void {
    if (document.fullscreenElement && document.hasFocus()) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }

  showAlertMessage(message: string, type: 'success' | 'error') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 3000);
  }

  logout(): void {
    this.authService.logout();
    this.toastr.success('Logged out successfully! Redirecting to login...', 'Success', {
      timeOut: 1500,
      positionClass: 'toast-top-right',
      progressBar: true,
      closeButton: true
    });
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1500);
  }
}
