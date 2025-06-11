import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CheatingReportService, CheatingReport } from '../../../services/cheating-report.service';
import { ExamCountService } from '../../../services/exam-count.service';
import { ExamService } from '../../../services/exam.service';
import { DataService } from '../../../services/data.service';
import { map, switchMap, catchError } from 'rxjs/operators';
import { forkJoin, of, throwError } from 'rxjs';

interface EnhancedCheatingReport extends CheatingReport {
  studentName?: string;
  examTitle?: string;
}

@Component({
  selector: 'app-cheating-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cheating-reports.component.html',
  styleUrls: ['./cheating-reports.component.css']
})
export class CheatingReportsComponent implements OnInit {
  searchQuery: string = '';
  statusFilter: string = 'all';
  filteredReports: EnhancedCheatingReport[] = [];
  cheatingReports: EnhancedCheatingReport[] = [];
  pagedReports: EnhancedCheatingReport[] = []; 
  isLoading = true;
  errorMessage: string | null = null;
  currentPage = 1;
  itemsPerPage = 10; 
  totalPages = 0;

  constructor(
    private cheatingReportService: CheatingReportService,
    private dataService: DataService,
    private examCountService: ExamCountService,
    private examService: ExamService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Cheating Logs');
    this.metaService.updateTag({ name: 'description', content: 'Monitor and manage cheating logs in the exam platform. View detailed reports of suspicious activities during exams.' });
    this.metaService.updateTag({ name: 'keywords', content: 'cheating logs, exam monitoring, suspicious activities, exam security, teacher dashboard' });

    this.loadReports();
    this.loadExamsForCount();
  }
  private loadExamsForCount(): void {
    this.examService.getAllExamsForTeacher().subscribe(exams => {
      this.examCountService.updateAdminExamCount(exams?.length ?? 0);
    });
  }

  loadReports(): void {
    console.log('Loading cheating logs...');
    this.isLoading = true;
    this.errorMessage = null;
    this.cheatingReportService.getAllReports().pipe(
      switchMap(reports => {
        console.log('Fetched raw reports:', reports);
        if (!reports || reports.length === 0) {
          console.log('No logs found or logs fetch failed, returning empty array.');
          return of([]);
        }
        const studentIds = [...new Set(reports.map(r => r.studentId).filter(id => id != null))];
        const examIds = [...new Set(reports.map(r => r.examId).filter(id => id != null))];

        console.log('Unique Student IDs to fetch:', studentIds);
        console.log('Unique Exam IDs to fetch:', examIds);

        const studentDetails$ = studentIds.map(id =>
          this.dataService.getUserById(id).pipe(
            map(user => ({ id, name: user.name })),
            catchError(err => {
              console.error(`Failed to fetch student details for ID ${id}:`, err);
              return of({ id, name: `Unknown Student (ID: ${id})` });
            })
          )
        );

        const examDetails$ = examIds.map(id =>
          this.dataService.getExamById(id).pipe(
            map(exam => ({ id, title: exam.title })),
            catchError(err => {
              console.error(`Failed to fetch exam details for ID ${id}:`, err);
              return of({ id, title: `Unknown Exam (ID: ${id})` });
            })
          )
        );

        if (studentDetails$.length === 0 && examDetails$.length === 0) {
          console.log('No student or exam details to fetch.');
          return of({ reports, students: [], exams: [] });
        }

        return forkJoin({
          reports: of(reports),
          students: forkJoin(studentDetails$),
          exams: forkJoin(examDetails$)
        }).pipe(
          catchError(err => {
            console.error('ForkJoin error during details combination:', err);
            return throwError(() => new Error('Failed to combine report details.'));
          })
        );
      }),
      catchError(err => {
        console.error('Error fetching initial logs:', err);
        this.errorMessage = 'Failed to load initial cheating logs.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe({
      next: (result) => {
        console.log('Logs subscription next received:', result);
        if (Array.isArray(result)) {
          console.log('Received empty array from initial fetch error handler.');
          this.cheatingReports = [];
          this.filteredReports = [];
        } else if (result) {
          const { reports, students, exams } = result;
          console.log('Processing logs with fetched details...', { reports, students, exams });
          this.cheatingReports = reports.map(report => ({
            ...report,
            studentName: students.find(s => s.id === report.studentId)?.name || (report.studentId ? `Unknown Student (ID: ${report.studentId})` : 'Unknown Student'),
            examTitle: exams.find(e => e.id === report.examId)?.title || (report.examId ? `Unknown Exam (ID: ${report.examId})` : 'Unknown Exam')
          }));
          this.filteredReports = [...this.cheatingReports];
          console.log('Final processed logs for display:', this.cheatingReports);
        } else {
          console.log('Received unexpected null or undefined result.');
          this.cheatingReports = [];
          this.filteredReports = [];
        }
        if (!this.errorMessage) {
          this.isLoading = false;
        }
        this.calculateTotalPages(); 
        this.paginateReports(); 
      },
      error: (err) => {
        console.error('Logs subscription error:', err);
        this.errorMessage = err.message || 'An unexpected error occurred while loading logs.';
        this.isLoading = false;
        this.cheatingReports = [];
        this.filteredReports = [];
      },
      complete: () => {
        console.log('Logs subscription complete.');
        this.isLoading = false;
      }
    });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.cheatingReports.length / this.itemsPerPage);
  }

  handleSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value.toLowerCase();
    this.currentPage = 1; 
    this.applyFilters();
  }

  handleStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter = select.value;
    this.currentPage = 1; 
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredReports = this.cheatingReports.filter((report) => {
      const matchesSearch = this.searchQuery === '' ||
        (report.studentName?.toLowerCase().includes(this.searchQuery) ||
          report.examTitle?.toLowerCase().includes(this.searchQuery));

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'tab' && report.cheatingType === "tab switch") ||
        (this.statusFilter === 'minimize' && report.cheatingType === "window minimize");

      return matchesSearch && matchesStatus;
    });

    this.totalPages = Math.ceil(this.filteredReports.length / this.itemsPerPage);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }

    this.paginateReports();
  }

  paginateReports(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedReports = this.filteredReports.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateReports();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  exportToCsv(): void {
    if (this.cheatingReports.length === 0) {
      console.warn('No logs to export.');
      return;
    }

    const replacer = (key: string, value: any) => (value === null ? '' : value); 
    const header = ['Report ID', 'Student Name', 'Exam Title', 'Timestamp', 'Cheating Type'];
    const csv = this.cheatingReports.map(report => header.map(fieldName => {
      switch (fieldName) {
        case 'Report ID': return JSON.stringify(report.id, replacer);
        case 'Student Name': return JSON.stringify(report.studentName || '', replacer);
        case 'Exam Title': return JSON.stringify(report.examTitle || '', replacer);
        case 'Timestamp': return JSON.stringify(report.timestamp, replacer);
        case 'Cheating Type': return JSON.stringify(report.cheatingType, replacer);
        default: return '';
      }
    }).join(','));

    csv.unshift(header.join(','));
    const csvString = csv.join('\r\n');

    const a = document.createElement('a');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    a.setAttribute('href', url);
    a.setAttribute('download', 'cheating-logs.csv');
    a.click();

    URL.revokeObjectURL(url);
  }
  refreshResults(): void {
    this.currentPage = 1;
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.loadReports();
  }
} 