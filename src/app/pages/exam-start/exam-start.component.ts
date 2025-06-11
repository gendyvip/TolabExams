import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService, ExamData } from '../../services/data.service';
import { QuestionService, Question } from '../../services/question.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FocusModeService } from '../../services/focus-mode.service';
import { AuthService } from '../../services/auth.service';
import { CheatingDetectorService } from '../../services/cheating-detector.service';
import { Title, Meta } from '@angular/platform-browser';

interface ExamQuestion {
  id?: number;
  title: string;
  options: string[];
  points: number;
  answer: number;
  examId: number;
}

@Component({
  selector: 'app-exam-start',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-start.component.html',
  styleUrl: './exam-start.component.css',
})
export class ExamStartComponent implements OnInit, OnDestroy {
  examId: string | null = null;
  resultId: number | null = null;
  currentQuestionIndex = 0;
  timeLeft = 45 * 60;
  totalTime = 45 * 60;
  timerInterval: any;
  answers: { [questionId: number]: number } = {};
  isLoading = true;
  error = false;
  exam: ExamData | null = null;
  progressPercentage = 100;
  userRole: string | null = null;

  questions: ExamQuestion[] = [];
  questionsLoaded = false;

  private dataSubscription!: Subscription;
  private examSubscription!: Subscription;
  private questionsSubscription!: Subscription;
  private keydownListener: any;
  private contextMenuListener: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private questionService: QuestionService,
    private toastr: ToastrService,
    private focusModeService: FocusModeService,
    private authService: AuthService,
    private cheatingDetectorService: CheatingDetectorService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    // Set initial title and meta tags
    this.titleService.setTitle('Start Exam');
    this.metaService.updateTag({ name: 'description', content: 'Begin your exam session. Complete all questions within the time limit and submit your answers.' });
    this.metaService.updateTag({ name: 'keywords', content: 'start exam, online exam, exam session, student assessment, timed exam' });

    this.userRole = this.authService.getUserRole();
    this.examId = this.route.snapshot.paramMap.get('id');

    if (this.examId) {
      this.startExam();
    } else {
      this.handleError();
    }
  }

  private startExam(): void {
    const examId = parseInt(this.examId!);

    if (this.userRole === 'student') {
      this.examSubscription = this.dataService.takeExam(examId).subscribe({
        next: (response: any) => {
          console.log('Take exam response:', response);
          this.resultId = response.resultId;
          if (response.exam) {
            this.exam = response.exam;
            if (response.exam.questions && response.exam.questions.length > 0) {
              this.questions = response.exam.questions.map((q: any) => ({
                id: q.id,
                title: q.title,
                options: q.options,
                points: q.points,
                answer: q.answer,
                examId: q.examId,
              }));
              this.focusModeService.setFocusMode(true);
              this.toastr.info(
                'You are now in Focus Mode. All distractions are disabled.',
                'Focus Mode'
              );
              this.disableKeydown();
              this.disableContextMenu();
              this.enterFullscreen();
              this.questionsLoaded = true;
              this.setExamDuration();
              this.initializeExam();
              // Update meta tags with exam-specific information
              this.updateMetaTags();
            } else {
              console.log(
                'Questions not included in takeExam response, fetching separately...'
              );
              this.setExamDuration();
              this.loadQuestions(examId);
            }
          } else {
            console.log(
              'Exam data not included in takeExam response, fetching exam data...'
            );
            this.dataService.getExamById(examId).subscribe({
              next: (exam: ExamData) => {
                this.exam = exam;
                this.setExamDuration();
                this.loadQuestions(examId);
              },
              error: (err: any) => {
                console.error('Error fetching exam data:', err);
                this.handleError();
              },
            });
          }
        },
        error: (err: any) => {
          console.error('Error starting exam:', err);
          if (err.status === 403) {
            this.toastr.error(
              'You have already taken this exam or it is not available yet',
              'Access Denied'
            );
          } else {
            this.toastr.error('Failed to start exam', 'Error');
          }
          this.handleError();
        },
      });
    } else {
      this.dataService.getExamById(examId).subscribe({
        next: (exam: ExamData) => {
          this.exam = exam;
          this.setExamDuration();
          this.loadQuestions(examId);
        },
        error: (err: any) => {
          console.error('Error fetching exam:', err);
          this.handleError();
        },
      });
    }
  }

  private loadQuestions(examId: number): void {
    this.questionsSubscription = this.questionService
      .getQuestions(examId)
      .subscribe({
        next: (questions: Question[]) => {
          console.log('Loaded questions:', questions);
          this.questions = questions.map((q) => ({
            id: q.id,
            title: q.title,
            options: q.options,
            points: q.points,
            answer: q.answer,
            examId: q.examId,
          }));
          this.questionsLoaded = true;
          this.initializeExam();
        },
        error: (err: any) => {
          console.error('Error fetching questions:', err);
          this.toastr.error('Failed to load exam questions', 'Error');
          this.handleError();
        },
      });
  }

  private setExamDuration(): void {
    if (this.exam?.duration) {
      this.timeLeft = this.exam.duration * 60;
      this.totalTime = this.exam.duration * 60;
      console.log(
        `Exam duration set to: ${this.exam.duration} minutes (${this.timeLeft} seconds)`
      );
    }
    this.progressPercentage = 100;
  }

  private initializeExam(): void {
    console.log('Initializing exam...');
    console.log('Exam:', this.exam);
    console.log('Questions loaded:', this.questionsLoaded);
    console.log('Questions count:', this.questions.length);

    if (!this.exam || !this.questionsLoaded || this.questions.length === 0) {
      console.log('Cannot initialize exam - missing data');
      return;
    }

    this.isLoading = false;
    this.error = false;
    this.answers = {};
    this.startTimer();
    console.log('Exam initialized successfully');
  }

  submitExam(): void {
    if (!this.resultId) {
      this.toastr.error('Invalid exam session', 'Error');
      return;
    }

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.cheatingDetectorService.stopDetection();

    this.dataService.submitExam(this.resultId, this.answers).subscribe({
      next: () => {
        this.toastr.success('Exam submitted successfully!', 'Success');
        this.focusModeService.setFocusMode(false);
        this.enableKeydown();
        this.enableContextMenu();
        this.exitFullscreen();
        this.router.navigate(['/student/results', this.resultId]);
      },
      error: (err: any) => {
        console.error('Error submitting exam:', err);
        this.toastr.error('Failed to submit exam', 'Error');
      },
    });
  }

  handleError(): void {
    this.isLoading = false;
    this.error = true;
    this.exam = null;
    this.questions = [];
    this.answers = {};
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.progressPercentage = (this.timeLeft / this.totalTime) * 100;
      } else {
        this.submitExam();
      }
    }, 1000);

    const studentId = this.authService.currentUserValue?.id;
    const examId = parseInt(this.examId!);

    if (studentId && examId) {
      this.cheatingDetectorService.startDetection(studentId, examId);
    } else {
      console.error(
        'Could not start cheating detection: Missing student ID or exam ID.'
      );
    }
  }

  formatTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get allQuestionsAnswered(): boolean {
    return this.answeredCount === this.questions.length;
  }

  get submitButtonClass(): string {
    return 'px-8 py-3 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700';
  }

  getCurrentQuestionAnswer(): number {
    const questionId = this.questions[this.currentQuestionIndex]?.id;
    return questionId ? this.answers[questionId] ?? -1 : -1;
  }

  setCurrentQuestionAnswer(answerIndex: number): void {
    const questionId = this.questions[this.currentQuestionIndex]?.id;
    if (questionId) this.answers[questionId] = answerIndex;
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      this.currentQuestionIndex = index;
    }
  }

  navigateToExams(): void {
    this.focusModeService.setFocusMode(false);
    this.enableKeydown();
    this.enableContextMenu();
    this.exitFullscreen();
    this.router.navigate(['/student/exams']);
  }

  ngOnDestroy(): void {
    this.focusModeService.setFocusMode(false);
    this.enableKeydown();
    this.enableContextMenu();
    this.exitFullscreen();

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.dataSubscription) this.dataSubscription.unsubscribe();
    if (this.examSubscription) this.examSubscription.unsubscribe();
    if (this.questionsSubscription) this.questionsSubscription.unsubscribe();
    this.cheatingDetectorService.stopDetection();
  }

  disableKeydown(): void {
    this.keydownListener = (event: KeyboardEvent) => {
      if (
        ['Tab', 'F12'].includes(event.key) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        event.preventDefault();
        return false;
      }
      return true;
    };
    window.addEventListener('keydown', this.keydownListener, true);
  }

  enableKeydown(): void {
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener, true);
      this.keydownListener = null;
    }
  }

  disableContextMenu(): void {
    this.contextMenuListener = (event: MouseEvent) => {
      event.preventDefault();
      return false;
    };
    window.addEventListener('contextmenu', this.contextMenuListener, true);
  }

  enableContextMenu(): void {
    if (this.contextMenuListener) {
      window.removeEventListener('contextmenu', this.contextMenuListener, true);
      this.contextMenuListener = null;
    }
  }

  enterFullscreen(): void {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if ((elem as any).webkitRequestFullscreen)
      (elem as any).webkitRequestFullscreen();
    else if ((elem as any).msRequestFullscreen)
      (elem as any).msRequestFullscreen();
  }

  exitFullscreen(): void {
    if (document.exitFullscreen) document.exitFullscreen();
    else if ((document as any).webkitExitFullscreen)
      (document as any).webkitExitFullscreen();
    else if ((document as any).msExitFullscreen)
      (document as any).msExitFullscreen();
  }

  private updateMetaTags(): void {
    if (this.exam) {
      // Set dynamic title based on exam title
      this.titleService.setTitle(`${this.exam.title} - Exam Running`);

      // Set meta description
      this.metaService.updateTag({
        name: 'description',
        content: `Take your ${this.exam.title} exam. ${this.questions.length} questions, ${this.exam.duration} minutes duration. Complete all questions within the time limit.`
      });

      // Set meta keywords
      this.metaService.updateTag({
        name: 'keywords',
        content: `exam, ${this.exam.category}, ${this.exam.title}, online exam, ${this.exam.duration} minutes, student assessment`
      });
    }
  }
}
