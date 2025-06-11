import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LgcardComponent } from '../../shared/components/lgcard/lgcard.component';
import { DataService, StudentExamResult } from '../../services/data.service';
import { ExamService } from '../../services/exam.service';
import { ExamCountService } from '../../services/exam-count.service';
import { Title, Meta } from '@angular/platform-browser';

interface ResultCardData {
  id: number;
  title: string;
  completedAgo: string;
  questionsCount: number;
  scoreText: string;
  scorePercent: number;
}

@Component({
  selector: 'app-results',
  imports: [LgcardComponent, CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent implements OnInit {
  results: ResultCardData[] = [];
  searchResult: string = '';
  title: string = 'all';
  filteredResults: ResultCardData[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private dataService: DataService,
    private examService: ExamService,
    private examCountService: ExamCountService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('My Results');
    this.metaService.updateTag({
      name: 'description',
      content: 'View your exam results, track your progress, and analyze your performance across different exams.'
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: 'exam results, student performance, exam scores, education platform, assessment results'
    });

    this.loadResults();
    this.loadExamsForCount();
  }

  private loadResults(): void {
    this.loading = true;
    this.error = null;

    this.dataService.getStudentAllResults().subscribe({
      next: (examResults: StudentExamResult[]) => {
        this.results = this.transformResults(examResults);
        this.filteredResults = [...this.results]; 
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading results:', error);
        this.error = 'Failed to load results. Please try again.';
        this.loading = false;
        this.results = [];
        this.filteredResults = [];
      },
    });
  }


  private loadExamsForCount(): void {
    this.examService.getAllExamsForStudent().subscribe(exams => {
      this.examCountService.updateStudentExamCount(exams ?? []);
    });
  }

  private transformResults(examResults: StudentExamResult[]): ResultCardData[] {
    return examResults.map((result) => ({
      id: result.id,
      title: result.examTitle,
      completedAgo: this.getTimeAgo(result.createdAt),
      questionsCount: result.totalQuestions,
      scoreText: `${result.correctAnswers}/${result.totalQuestions} (${result.score}%)`,
      scorePercent: result.score,
    }));
  }

  private getTimeAgo(dateString: string): string {
    const now = new Date();
    const completedDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - completedDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }

  onRetry(): void {
    this.loadResults();
    this.loadExamsForCount();
  }

  refreshResults(): void {
    this.onRetry();
  }

  handleSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchResult = inputElement.value.trim().toLowerCase();
    this.applyFilters();
  }

  handleCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.title = selectElement.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters(): void {
    if (!this.results.length) {
      this.filteredResults = [];
      return;
    }

    this.filteredResults = this.results.filter((result) => {
      const matchesSearch = this.searchResult === '' ||
        result.title.toLowerCase().includes(this.searchResult);
      const matchesCategory = this.title === 'all' ||
        (this.title === 'passed' && result.scorePercent >= 60) ||
        (this.title === 'failed' && result.scorePercent < 60);

      return matchesSearch && matchesCategory;
    });
  }
}
