import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { ExamService } from '../../../services/exam.service';
import { ExamCountService } from '../../../services/exam-count.service';
import { ConfirmModalComponent } from "../../../shared/components/confirm-modal/confirm-modal.component";

interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  examResults: {
    totalExams: number;
    passedExams: number;
    averageScore: number;
  };
}

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConfirmModalComponent],
  templateUrl: './student-management.component.html',
})
export class StudentManagementComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  currentUser: any = null;
  loading: boolean = true;
  error: string | null = null;
  showDeleteModal = false;
  studentToDelete: Student | null = null;
  isDeleting = false;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  pagedStudents: Student[] = [];

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private examService: ExamService,
    private examCountService: ExamCountService,
    private titleService: Title,
    private metaService: Meta
  ) {
    this.initializeUserInfo();
  }

  ngOnInit() {
    if (this.currentUser?.role !== 'teacher') {
      window.location.href = '/dashboard';
      return;
    }

    this.titleService.setTitle('Tolab Management');
    this.metaService.updateTag({ name: 'description', content: 'Manage and monitor student performance in the exam platform. View detailed statistics, track progress, and handle student accounts.' });
    this.metaService.updateTag({ name: 'keywords', content: 'tolab management, exam performance, student statistics, academic tracking, teacher dashboard' });

    this.loadStudents();
    this.loadExamsForCount();
  }

  private loadExamsForCount(): void {
    this.examService.getAllExamsForTeacher().subscribe(exams => {
      this.examCountService.updateAdminExamCount(exams?.length ?? 0);
    });
  }

  private initializeUserInfo() {
    this.currentUser = this.authService.getUser();
  }

  loadStudents() {
    this.loading = true;
    this.error = null;

    this.dataService.getAllStudents().subscribe({
      next: (response) => {
        this.students = response.data;
        this.filteredStudents = [...this.students];
        this.calculateTotalPages();
        this.paginateStudents();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load students. Please try again later.';
        this.loading = false;
        console.error('Error loading students:', err);
      }
    });
  }

  refreshStudents(): void {
    this.loadStudents();
    this.loadExamsForCount();
  }

  handleSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.trim().toLowerCase();
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
    if (!this.students.length) {
      this.filteredStudents = [];
      this.pagedStudents = [];
      return;
    }

    this.filteredStudents = this.students.filter(student => {
      const matchesSearch = this.searchTerm === '' ||
        student.name.toLowerCase().includes(this.searchTerm) ||
        student.email.toLowerCase().includes(this.searchTerm);

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'excellent' && student.examResults.averageScore >= 70) ||
        (this.statusFilter === 'good' && student.examResults.averageScore >= 50 && student.examResults.averageScore < 70) ||
        (this.statusFilter === 'needs_improvement' && student.examResults.averageScore < 50);

      return matchesSearch && matchesStatus;
    });

    this.calculateTotalPages();
    this.paginateStudents();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  paginateStudents(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedStudents = this.filteredStudents.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateStudents();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getPassRate(student: Student): number {
    if (student.examResults.totalExams === 0) return 0;
    return (student.examResults.passedExams / student.examResults.totalExams) * 100;
  }

  getStatusColor(score: number): string {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  }

  confirmDelete(student: Student) {
    this.studentToDelete = student;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.studentToDelete = null;
    this.showDeleteModal = false;
    this.isDeleting = false;
  }

  deleteStudent() {
    if (!this.studentToDelete) return;

    this.isDeleting = true;
    this.dataService.deleteStudent(this.studentToDelete.id).subscribe({
      next: () => {
        this.students = this.students.filter(s => s.id !== this.studentToDelete?.id);
        this.filteredStudents = this.filteredStudents.filter(s => s.id !== this.studentToDelete?.id);
        this.showDeleteModal = false;
        this.studentToDelete = null;
        this.isDeleting = false;
        this.calculateTotalPages();
        this.paginateStudents();
      },
      error: (err) => {
        this.error = 'Failed to delete student. Please try again later.';
        this.isDeleting = false;
        console.error('Error deleting student:', err);
      }
    });
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

} 