import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Title, Meta } from '@angular/platform-browser';

interface ExamResultData {
  id: number;
  examTitle: string;
  examDescription: string;
  score: number;
  totalPoints: number;
  passed: boolean;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  completionDate: string;
  questions: ResultQuestion[];
}

interface ResultQuestion {
  id: number;
  title: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number;
  isCorrect: boolean;
  points: number;
}

@Component({
  selector: 'app-result',
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css',
})
export class ResultComponent implements OnInit, OnDestroy {
  resultId: string | null = null;
  resultData: ExamResultData | null = null;
  isLoading = true;
  error = false;
  errorMessage = '';

  // UI state
  currentPage = 0;
  paginationItems: any[] = [];

  // Computed properties  
  get score(): any {
    return this.resultData?.score
  }

  get passingScore(): number {
    return 60; // 60% passing threshold
  }

  get completionDate(): Date {
    return this.resultData
      ? new Date(this.resultData.completionDate)
      : new Date();
  }

  get stats() {
    if (!this.resultData) return [];

    return [
      { label: 'Correct', value: this.resultData.correctAnswers },
      { label: 'Incorrect', value: this.resultData.incorrectAnswers },
      { label: 'Total', value: this.resultData.totalQuestions },
      { label: 'Status', value: this.completionDate.toLocaleDateString() },
    ];
  }

  get questions(): ResultQuestion[] {
    return this.resultData?.questions || [];
  }

  get currentQuestion(): ResultQuestion | null {
    return this.questions.length > 0 ? this.questions[this.currentPage] : null;
  }

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private toastr: ToastrService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    // Set initial title and meta tags
    this.titleService.setTitle('Exam Result');
    this.metaService.updateTag({ name: 'description', content: 'View your exam results, including score, correct answers, and detailed performance analysis.' });
    this.metaService.updateTag({ name: 'keywords', content: 'exam results, test scores, performance analysis, exam feedback, test results' });

    this.resultId = this.route.snapshot.paramMap.get('id');

    if (this.resultId) {
      this.loadExamResult();
    } else {
      this.handleError('Invalid exam ID');
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadExamResult(): void {
    if (!this.resultId) return;

    const resultId = parseInt(this.resultId);

    // Get the exam result data
    const resultSub = this.dataService.getExamResult(resultId).subscribe({
      next: (result) => {
        console.log('Exam result:', result);
        // Handle both direct response and wrapped response formats
        if (result && (result.data || result.exam)) {
          this.processResultData(result);
        } else {
          console.error('Unexpected API response format:', result);
          this.handleError('Invalid response format from server');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading exam result:', err);
        this.handleError('Failed to load exam results');
      },
    });

    this.subscription.add(resultSub);
  }

  private processResultData(apiResult: any): void {
    console.log('Processing API result:', apiResult);

    // Handle the case where the API response might be wrapped in a data property
    const resultData = apiResult.data || apiResult;

    // Check if exam data exists
    if (!resultData.exam) {
      console.error('No exam data found in API response:', resultData);
      this.handleError('Invalid exam result data - missing exam information');
      return;
    }

    // Check if questions exist
    if (
      !resultData.exam.questions ||
      !Array.isArray(resultData.exam.questions)
    ) {
      console.error('No questions found in exam data:', resultData.exam);
      this.handleError('Invalid exam result data - missing questions');
      return;
    }

    // Transform the API response to match our component structure
    const submittedAnswers = JSON.parse(resultData.answers?.answer || '{}');

    const questions: ResultQuestion[] = resultData.exam.questions.map(
      (q: any) => ({
        id: q.id,
        title: q.title,
        options: q.options,
        correctAnswer: q.answer,
        userAnswer: submittedAnswers[q.id] ?? -1,
        isCorrect: submittedAnswers[q.id] === q.answer,
        points: q.points,
      })
    );

    const correctAnswers = questions.filter((q) => q.isCorrect).length;
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    this.resultData = {
      id: resultData.id,
      examTitle: resultData.exam.title,
      examDescription: resultData.exam.description,
      score: resultData.score,
      totalPoints: totalPoints,
      passed: resultData.passed,
      correctAnswers: correctAnswers,
      incorrectAnswers: questions.length - correctAnswers,
      totalQuestions: questions.length,
      completionDate: resultData.createdAt,
      questions: questions,
    };

    // Update title and meta tags with exam-specific information
    this.titleService.setTitle(`${this.resultData.examTitle} - Result`);
    this.metaService.updateTag({
      name: 'description',
      content: `View your results for ${this.resultData.examTitle}. Score: ${this.resultData.score}%, ${this.resultData.correctAnswers} correct answers out of ${this.resultData.totalQuestions} questions.`
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: `${this.resultData.examTitle}, exam results, test scores, ${this.resultData.passed ? 'passed' : 'failed'}, performance analysis`
    });

    this.paginationItems = Array(this.questions.length).fill(0);
  }

  private handleError(message: string): void {
    this.isLoading = false;
    this.error = true;
    this.errorMessage = message;
    this.toastr.error(message, 'Error');
  }

  getCorrectAnswer(): string {
    if (!this.currentQuestion) return '';

    const correctOption =
      this.currentQuestion.options[this.currentQuestion.correctAnswer];
    return correctOption || '';
  }

  getUserAnswer(): string {
    if (!this.currentQuestion || this.currentQuestion.userAnswer === -1) {
      return 'Not answered';
    }

    return (
      this.currentQuestion.options[this.currentQuestion.userAnswer] ||
      'Invalid answer'
    );
  }

  nextQuestion(): void {
    if (this.currentPage < this.questions.length - 1) {
      this.currentPage++;
    }
  }

  prevQuestion(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  goToPage(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      this.currentPage = index;
    }
  }

  goBackToExams(): void {
    this.router.navigate(['/student/exams']);
  }
}
