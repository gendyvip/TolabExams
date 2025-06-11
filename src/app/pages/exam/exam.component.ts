import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';
import { DataService, ExamData } from '../../services/data.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CheatingDetectorService } from '../../services/cheating-detector.service';
import { AuthService } from '../../services/auth.service';
import { Title, Meta } from '@angular/platform-browser';

interface Question {
  id: number;
  text: string;
  choices: string[];
  correctAnswer: number;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  questionsCount: number;
  category: string;
  creationDateInput: Date | string;
}

@Component({
  selector: 'app-exam',
  imports: [FormsModule, CommonModule],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css',
})
export class ExamComponent implements OnInit, OnDestroy {
  exams: Exam[] = [];
  filterdExam: ExamData | null = null;
  dataSubscription!: Subscription;
  examSubscription!: Subscription;
  path!: string | null;
  isLoading = true;
  error = false;

  // Exam state
  currentQuestionIndex = 0;
  timeLeft = 0; // Will be set from exam data
  timerInterval: any;
  answers: number[] = [];
  examDurationMinutes = 45; // Default fallback

  // Sample questions (replace with actual questions from your backend)
  questions: Question[] = [
    {
      id: 1,
      text: 'What is the correct way to declare a variable in JavaScript?',
      choices: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'let x = 5;'],
      correctAnswer: 3,
    },
    // Add more questions here
  ];

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router,
    private cheatingDetectorService: CheatingDetectorService,
    private authService: AuthService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    this.path = this.route.snapshot.paramMap.get('id');
    console.log('Exam ID from route:', this.path);

    if (this.path) {
      // First, try to get data from the shared service (from card component)
      this.dataSubscription = this.dataService.currentData.subscribe({
        next: (exams: ExamData[]) => {
          console.log('Received exams from service:', exams);

          if (exams && exams.length > 0) {
            // Find the exam with matching ID
            const examId = parseInt(this.path!);
            this.filterdExam = exams.find((exam) => exam.id === examId) || null;

            if (this.filterdExam) {
              console.log('Found exam from shared data:', this.filterdExam);
              this.setExamDuration();
              this.isLoading = false;
              this.error = false;
              // Set dynamic title and meta tags based on exam data
              this.updateMetaTags();
            } else {
              // If not found in shared data, fetch from API
              this.fetchExamById(examId);
            }
          } else {
            // No shared data, fetch from API
            const examId = parseInt(this.path!);
            this.fetchExamById(examId);
          }
        },
        error: (err: any) => {
          console.error('Error in exams subscription:', err);
          this.handleError();
        },
      });
    } else {
      this.handleError();
    }

    // Initialize answers array
    this.answers = new Array(this.questions.length).fill(-1);
  }

  private updateMetaTags(): void {
    if (this.filterdExam) {
      // Set dynamic title based on exam title
      this.titleService.setTitle(`${this.filterdExam.title}`);

      // Set meta description
      this.metaService.updateTag({
        name: 'description',
        content: `${this.filterdExam.description || 'Take this exam'} - ${this.filterdExam.questionsCount} questions, ${this.examDurationMinutes} minutes duration.`
      });

      // Set meta keywords
      this.metaService.updateTag({
        name: 'keywords',
        content: `exam, ${this.filterdExam.category}, ${this.filterdExam.title}, online exam, education platform, ${this.examDurationMinutes} minutes`
      });
    } else {
      // Default meta tags if no exam data
      this.titleService.setTitle('Exam');
      this.metaService.updateTag({
        name: 'description',
        content: 'Take your exam on our platform. Complete questions within the time limit and submit your answers.'
      });
      this.metaService.updateTag({
        name: 'keywords',
        content: 'exam, online exam, education platform, student assessment'
      });
    }
  }

  private fetchExamById(examId: number): void {
    console.log('Fetching exam by ID:', examId);

    this.examSubscription = this.dataService.getExamById(examId).subscribe({
      next: (exam: ExamData) => {
        console.log('Fetched exam from API:', exam);
        this.filterdExam = exam;
        this.setExamDuration();
        this.isLoading = false;
        this.error = false;
        // Update meta tags after fetching exam data
        this.updateMetaTags();
      },
      error: (err: any) => {
        console.error('Error fetching exam by ID:', err);
        this.handleError();
      },
    });
  }

  private handleError(): void {
    this.isLoading = false;
    this.error = true;
    this.filterdExam = null;
  }

  private setExamDuration(): void {
    if (this.filterdExam && this.filterdExam.duration) {
      this.examDurationMinutes = this.filterdExam.duration;
      this.timeLeft = this.filterdExam.duration * 60; // Convert minutes to seconds
    } else {
      // Fallback to default 45 minutes if no duration specified
      this.examDurationMinutes = 45;
      this.timeLeft = 45 * 60;
    }
    console.log(
      `Exam duration set to: ${this.examDurationMinutes} minutes (${this.timeLeft} seconds)`
    );
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.examSubscription) {
      this.examSubscription.unsubscribe();
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.cheatingDetectorService.stopDetection();
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.submitExam();
      }
    }, 1000);

    // Start cheating detection when the timer starts
    const studentId = this.authService.currentUserValue?.id; // Get student ID
    const examId = this.filterdExam?.id; // Get exam ID

    if (studentId && examId) {
      this.cheatingDetectorService.startDetection(studentId, examId);
    } else {
      console.error('Could not start cheating detection: Missing student ID or exam ID.');
    }
  }

  formatTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  selectAnswer(choiceIndex: number): void {
    this.answers[this.currentQuestionIndex] = choiceIndex;
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      this.currentQuestionIndex = index;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitExam(): void {
    // Calculate score
    const score = this.answers.reduce((total, answer, index) => {
      return total + (answer === this.questions[index].correctAnswer ? 1 : 0);
    }, 0);

    const percentage = (score / this.questions.length) * 100;

    // TODO: Send results to backend
    console.log('Exam submitted', {
      examId: this.path,
      score: percentage,
      answers: this.answers,
    });

    // Stop cheating detection when the exam is submitted
    this.cheatingDetectorService.stopDetection();
  }

  // In your exam component
  startExam(): void {
    if (this.filterdExam) {
      // Pass the exam data to the service before navigation
      // this.dataService.setCurrentExam(this.filterdExam);
      this.router.navigate(['/student/exams', this.path, 'start']);
    }
  }

  // Add public method for navigation
  navigateToExams(): void {
    this.router.navigate(['/student/exams']);
  }
}
