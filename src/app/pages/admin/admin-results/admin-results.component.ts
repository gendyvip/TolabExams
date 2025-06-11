import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, RecentResult } from '../../../services/admin.service';
import { ExamService } from '../../../services/exam.service';
import { ExamCountService } from '../../../services/exam-count.service';
import { Title, Meta } from '@angular/platform-browser';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Exam {
  id: number;
  title: string;
  userId: number;
}

interface Result {
  id: number;
  user: User;
  exam: Exam;
  score: number | null;
  passed: boolean | null;
  createdAt: string;
}

@Component({
  selector: 'app-admin-results',
  imports: [CommonModule],
  templateUrl: './admin-results.component.html',
  styleUrl: './admin-results.component.css',
})
export class AdminResultsComponent implements OnInit {
  searchQuery: string = '';
  statusFilter: string = 'all';
  filteredResults: Result[] = [];
  results: Result[] = [];
  loading: boolean = false;
  error: string | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  pagedFilteredResults: Result[] = []; 

  constructor(
    private adminService: AdminService,
    private examService: ExamService,
    private examCountService: ExamCountService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Tolab Results');
    this.metaService.updateTag({
      name: 'description',
      content: 'View and manage student exam results. Track performance, analyze scores, and export results. Filter and search through exam submissions.'
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: 'tolab results, student performance, exam scores, result analysis, exam submissions, teacher dashboard'
    });

    this.loadResults();
    this.loadExamsForCount();
  }

  private loadResults(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getRecentResults().subscribe({
      next: (response) => {
        this.results = this.transformBackendData(response.data);
        this.applyFilters(); 
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading results:', error);
        this.error = 'Failed to load results. Please try again.';
        this.loading = false;
        this.results = [];
        this.filteredResults = [];
        this.pagedFilteredResults = [];
        this.totalPages = 0;
      },
    });
  }

  private loadExamsForCount(): void {
    this.examService.getAllExamsForTeacher().subscribe(exams => {
      this.examCountService.updateAdminExamCount(exams?.length ?? 0);
    });
  }

  private transformBackendData(backendResults: RecentResult[]): Result[] {
    return backendResults.map((result) => ({
      id: result.id,
      user: {
        id: 0, 
        name: result.user.name,
        email: '', 
        role: 'student',
      },
      exam: {
        id: 0, 
        title: result.exam.title,
        userId: 0,
      },
      score: result.score,
      passed: result.passed,
      createdAt: result.createdAt,
    }));
  }

  loadResultsForExam(examId: number): void {
    this.loading = true;
    this.error = null;
    this.currentPage = 1;

    this.adminService.getRecentResults(examId).subscribe({
      next: (response) => {
        this.results = this.transformBackendData(response.data);
        this.applyFilters(); 
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading exam results:', error);
        this.error = 'Failed to load exam results. Please try again.';
        this.loading = false;
        this.results = [];
        this.filteredResults = [];
        this.pagedFilteredResults = [];
        this.totalPages = 0;
      },
    });
  }

  refreshResults(): void {
    this.currentPage = 1;
    this.loadResults();
    this.loadExamsForCount();
  }

  handleSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value.toLowerCase();
    this.currentPage = 1; 
    this.applyFilters();
  }

  handleStatusChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.statusFilter = selectElement.value.toLowerCase();
    this.currentPage = 1; 
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredResults = this.results.filter((result) => {
      const matchesSearch =
        result.user.name.toLowerCase().includes(this.searchQuery) ||
        result.exam.title.toLowerCase().includes(this.searchQuery);

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'passed' && result.passed === true) ||
        (this.statusFilter === 'failed' && result.passed === false) ||
        (this.statusFilter === 'pending' && result.passed === null);

      return matchesSearch && matchesStatus;
    });

    this.totalPages = Math.ceil(this.filteredResults.length / this.itemsPerPage);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1; 
    }
    this.paginateFilteredResults();
  }

  paginateFilteredResults(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedFilteredResults = this.filteredResults.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateFilteredResults();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getGrade(score: number | null): string {
    if (score === null || score === undefined) return '-';
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  getStatus(result: Result): { label: string; color: string } {
    if (result.passed === null) return { label: 'Pending', color: 'zinc' };
    if (result.passed && result.score !== null && result.score >= 90)
      return { label: 'Excellent', color: 'blue' };
    if (result.passed && result.score !== null && result.score >= 70)
      return { label: 'Passed', color: 'green' };
    if (!result.passed && result.score !== null)
      return { label: 'Failed', color: 'red' };
    return { label: 'Average', color: 'yellow' };
  }

  exportResults(): void {
    console.log('Exporting results...', this.filteredResults);

    if (this.filteredResults.length === 0) {
      console.warn('No filtered results to export.');
      return;
    }

    const replacer = (key: string, value: any) => (value === null ? '' : value); 
    const header = ['Student Name', 'Subject', 'Exam Date', 'Score', 'Grade', 'Status'];
    const csv = this.filteredResults.map(result => header.map(fieldName => {
      switch (fieldName) {
        case 'Student Name': return JSON.stringify(result.user.name, replacer);
        case 'Subject': return JSON.stringify(result.exam.title, replacer);
        case 'Exam Date': return JSON.stringify(this.formatDate(result.createdAt), replacer); 
        case 'Score': return JSON.stringify(result.score !== null ? `${result.score}/100` : '-', replacer); 
        case 'Grade': return JSON.stringify(this.getGrade(result.score), replacer); 
        case 'Status': return JSON.stringify(this.getStatus(result).label, replacer); 
        default: return '';
      }
    }).join(','));

    csv.unshift(header.join(',')); 
    const csvString = csv.join('\r\n');

    const a = document.createElement('a');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    a.setAttribute('href', url);
    a.setAttribute('download', 'exam-results.csv');
    a.click();

    URL.revokeObjectURL(url);
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString; 
    }
  }

}
