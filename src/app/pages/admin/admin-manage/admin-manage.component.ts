import { Component, OnInit } from '@angular/core';
import { CardComponent } from '../../../shared/components/card/card.component';
import { RouterLink } from '@angular/router';
import { ExamService } from '../../../services/exam.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ExamCountService } from '../../../services/exam-count.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-manage',
  standalone: true,
  imports: [CardComponent, RouterLink, ConfirmModalComponent],
  templateUrl: './admin-manage.component.html',
  styleUrl: './admin-manage.component.css',
})
export class AdminManageComponent implements OnInit {
  searchExam: string = '';
  filteredExams: any[] = [];
  category: string = 'all';
  exams: any[] = [];
  uniqueCategories: string[] = [];
  showDeleteModal = false;
  examToDelete: number | null = null;
  isDeleting = false;
  isLoading = false;

  constructor(
    private examService: ExamService,
    private toastr: ToastrService,
    private examCountService: ExamCountService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Manage Exams');
    this.metaService.updateTag({
      name: 'description',
      content: 'Manage and organize your exams. Create, edit, delete, and filter exams by category. Monitor exam status and maintain your exam library.'
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: 'exam management, create exam, edit exam, delete exam, exam categories, exam library, teacher controls'
    });

    this.isLoading = true;
    this.examService.getAllExamsForTeacher().subscribe((exams) => {
      this.exams = exams ?? [];
      this.filteredExams = exams ?? [];
      this.uniqueCategories = this.extractUniqueCategories(this.exams);
      this.examCountService.updateAdminExamCount(this.exams.length);
      console.log('filtered', this.filteredExams);
      this.isLoading = false;
    });
  }

  private extractUniqueCategories(exams: any[]): string[] {
    const categories = new Set(exams.map(exam => exam.category).filter(Boolean));
    return Array.from(categories).sort();
  }

  handleDelete(examId: number): void {
    this.examToDelete = examId;
    this.showDeleteModal = true;
  }

  onDeleteConfirm(): void {
    if (this.examToDelete) {
      this.isDeleting = true;
      const exam = this.exams.find((e) => e.id === this.examToDelete);

      this.examService.deleteExam(this.examToDelete).subscribe({
        next: () => {
          this.exams = this.exams.filter(
            (exam) => exam.id !== this.examToDelete
          );
          this.filteredExams = this.filteredExams.filter(
            (exam) => exam.id !== this.examToDelete
          );
          this.uniqueCategories = this.extractUniqueCategories(this.exams);
          this.examCountService.updateAdminExamCount(this.exams.length);
          this.toastr.success(`${exam?.title} has been deleted`, 'Successfully Deleted');
        },
        error: (error) => {
          console.error('Error deleting exam:', error);
          this.toastr.error('Failed to delete exam', '❌ Error');
        },
        complete: () => {
          this.isDeleting = false;
          this.closeModal();
        }
      });
    }
  }

  onDeleteCancel(): void {
    this.closeModal();
  }

  private closeModal(): void {
    this.showDeleteModal = false;
    this.examToDelete = null;
  }

  handleSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchExam = inputElement.value.toLowerCase();
    this.applyFilters();
  }

  handleCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.category = selectElement.value;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredExams = this.exams.filter((exam) => {
      const matchesSearch = exam.title.toLowerCase().includes(this.searchExam);
      const matchesCategory =
        this.category === 'all' ||
        exam.category?.toLowerCase() === this.category.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }

  hasActiveFilters(): boolean {
    return this.searchExam !== '' || this.category !== 'all';
  }
}
