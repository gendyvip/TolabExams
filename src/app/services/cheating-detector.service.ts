import { Injectable } from '@angular/core';
import { CheatingReportService } from './cheating-report.service';

@Injectable({
  providedIn: 'root',
})
export class CheatingDetectorService {
  private studentId: number | null = null;
  private examId: number | null = null;
  private isDetectorActive = false;
  private lastReportTime = 0;
  private lastReportType: string | null = null;
  private initialWindowHeight: number = 0;

  constructor(private cheatingReportService: CheatingReportService) {}

  startDetection(studentId: number, examId: number): void {
    this.studentId = studentId;
    this.examId = examId;
    this.isDetectorActive = true;
    this.lastReportTime = 0;
    this.lastReportType = null;
    this.initialWindowHeight = window.outerHeight;

    // Add event listeners
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    window.addEventListener('resize', this.handleWindowResize);

    console.log('Cheating detection started for student', studentId, 'on exam', examId);
  }

  stopDetection(): void {
    this.isDetectorActive = false;
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('resize', this.handleWindowResize);

    this.studentId = null;
    this.examId = null;
    this.lastReportTime = 0;
    this.lastReportType = null;
    this.initialWindowHeight = 0;

    console.log('Cheating detection stopped.');
  }

  private handleVisibilityChange = () => {
    if (!this.isDetectorActive) return;

    const now = Date.now();
    if (document.hidden) {
      // Tab switch detected
      if (now - this.lastReportTime > 1000) {
        console.warn('Cheating detected: Tab switched!');
        this.sendCheatingReport('tab switch');
        this.lastReportTime = now;
        this.lastReportType = 'tab switch';
      }
    }
  };

  private handleWindowBlur = () => {
    if (!this.isDetectorActive) return;

    const now = Date.now();
    // Only report window minimize if it's not a tab switch and window height is significantly reduced
    if (now - this.lastReportTime > 1000 && !document.hidden) {
      const currentHeight = window.outerHeight;
      const heightReduction = this.initialWindowHeight - currentHeight;
      const reductionPercentage = (heightReduction / this.initialWindowHeight) * 100;

      // Only report if window height is reduced by more than 30% but not completely minimized
      if (reductionPercentage > 30 && reductionPercentage < 90) {
        console.warn('Cheating detected: Window minimized!', 'Height reduction:', reductionPercentage.toFixed(1) + '%');
        this.sendCheatingReport('window minimize');
        this.lastReportTime = now;
        this.lastReportType = 'window minimize';
      }
    }
  };

  private handleWindowResize = () => {
    if (!this.isDetectorActive) return;

    const now = Date.now();
    if (now - this.lastReportTime > 1000 && !document.hidden) {
      const currentHeight = window.outerHeight;
      const heightReduction = this.initialWindowHeight - currentHeight;
      const reductionPercentage = (heightReduction / this.initialWindowHeight) * 100;

      // Only report if window height is reduced by more than 30% but not completely minimized
      if (reductionPercentage > 30 && reductionPercentage < 90) {
        console.warn('Cheating detected: Window resized!', 'Height reduction:', reductionPercentage.toFixed(1) + '%');
        this.sendCheatingReport('window minimize');
        this.lastReportTime = now;
        this.lastReportType = 'window minimize';
      }
    }
  };

  private handleWindowFocus = () => {
    if (!this.isDetectorActive) return;
    // Update initial height when window regains focus
    this.initialWindowHeight = window.outerHeight;
  };

  private sendCheatingReport(cheatingType: string): void {
    if (this.studentId !== null && this.examId !== null) {
      const report = {
        studentId: this.studentId,
        examId: this.examId,
        cheatingType: cheatingType,
      };

      this.cheatingReportService.createReport(report).subscribe({
        next: () => {
          console.log('Cheating report sent successfully:', cheatingType);
        },
        error: (err) => console.error('Failed to send cheating report:', err),
      });
    }
  }

  ngOnDestroy(): void {
    this.stopDetection();
  }
}
