import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { Question } from './question.service';

export interface StudentExamResult {
  id: number;
  examTitle: string;
  score: number;
  passed: boolean;
  createdAt: string;
  category: string;
  correctAnswers: number;
  totalQuestions: number;
}

export interface StudentDashboardStats {
  totalExams: number;
  completedExams: number;
  averageScore: number;
  passRate: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface StudentPerformanceData {
  labels: string[];
  scores: number[];
}

export interface CategoryPerformance {
  [category: string]: number;
}

export interface ApiExamData {
  id: number;
  title: string;
  description?: string;
  category: string;
  duration?: number;
  questionsCount?: number;
  totalQuestions?: number;
  difficulty?: string;
  createdAt?: string;
  updatedAt?: string;
  instructorId?: number;
  instructorName?: string;
  instructor?: {
    id?: number;
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  teacher?: {
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  teacherName?: string;
  createdBy?: string;
  author?: string;
}

export interface ExamData {
  id: number;
  title: string;
  description: string;
  category: string;
  duration?: number;
  questionsCount: number;
  totalQuestions?: number;
  difficulty?: string;
  createdAt?: string;
  creationDateInput: string | Date;
  instructorName: string;
  questions?: Question[]; // Add this property
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private baseUrl = 'https://tolabexams-backend.onrender.com/api/v1';

  private dataSource = new BehaviorSubject<ExamData[]>([]);
  public currentData = this.dataSource.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) { }

  changeData(data: ExamData[]): void {
    this.dataSource.next(data);
  }

  private extractInstructorName(apiExam: ApiExamData): string {
    let instructorName = 'Unknown Instructor';
    if (apiExam.instructorName?.trim()) {
      instructorName = apiExam.instructorName.trim();
    } else if (apiExam.instructor?.name?.trim()) {
      instructorName = apiExam.instructor.name.trim();
    } else if (apiExam.instructor?.firstName || apiExam.instructor?.lastName) {
      instructorName = `${apiExam.instructor.firstName ?? ''} ${apiExam.instructor.lastName ?? ''
        }`.trim();
    } else if (apiExam.teacher?.name?.trim()) {
      instructorName = apiExam.teacher.name.trim();
    } else if (apiExam.teacher?.firstName || apiExam.teacher?.lastName) {
      instructorName = `${apiExam.teacher.firstName ?? ''} ${apiExam.teacher.lastName ?? ''
        }`.trim();
    } else if (apiExam.teacherName?.trim()) {
      instructorName = apiExam.teacherName.trim();
    } else if (apiExam.createdBy?.trim()) {
      instructorName = apiExam.createdBy.trim();
    } else if (apiExam.author?.trim()) {
      instructorName = apiExam.author.trim();
    }
    return instructorName;
  }

  private transformExamData(apiExam: ApiExamData): ExamData {
    return {
      id: apiExam.id,
      title: apiExam.title,
      description: apiExam.description || 'No description available',
      category: apiExam.category,
      duration: apiExam.duration,
      questionsCount: apiExam.questionsCount || apiExam.totalQuestions || 0,
      totalQuestions: apiExam.totalQuestions,
      difficulty: apiExam.difficulty,
      createdAt: apiExam.createdAt,
      creationDateInput: apiExam.createdAt
        ? new Date(apiExam.createdAt)
        : new Date(),
      instructorName: this.extractInstructorName(apiExam),
    };
  }

  getExams(): Observable<ExamData[]> {
    return this.http.get<ApiExamData[]>(`${this.baseUrl}/exams`).pipe(
      tap((apiExams) => console.log('Raw exams:', apiExams)),
      map((apiExams) => apiExams.map((exam) => this.transformExamData(exam))),
      tap((transformed) => console.log('Transformed exams:', transformed))
    );
  }

  getExamById(examId: number): Observable<ExamData> {
    console.log(`Fetching exam with ID: ${examId}`);
    const role = this.authService.getUserRole();
    const endpoint =
      role === 'student'
        ? `${this.baseUrl}/exams/take-exam/${examId}`
        : `${this.baseUrl}/exams/${examId}`;

    return this.http.get<ApiExamData>(endpoint).pipe(
      tap((apiExam) => console.log(`Raw API exam ${examId}:`, apiExam)),
      map((apiExam) => this.transformExamData(apiExam)),
      tap({
        error: (error) =>
          console.error(`Error fetching exam ${examId}:`, error),
      })
    );
  }

  getStudentDashboardStats(): Observable<StudentDashboardStats> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');
    return this.http.get<StudentDashboardStats>(
      `${this.baseUrl}/students/dashboard/stats/${user.id}`
    );
  }

  getStudentRecentResults(limit: number = 5): Observable<StudentExamResult[]> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');
    return this.http.get<StudentExamResult[]>(
      `${this.baseUrl}/students/dashboard/recent-results/${user.id}?limit=${limit}`
    );
  }

  getStudentAllResults(): Observable<StudentExamResult[]> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');
    console.log('=== DEBUG: Getting Student Results ===');
    console.log('User ID:', user.id);
    return this.http.get<StudentExamResult[]>(
      `${this.baseUrl}/students/results/${user.id}`
    ).pipe(
      tap(results => {
        console.log('API Response for student results:', results);
        if (results && results.length > 0) {
          console.log('First result structure:', results[0]);
          console.log('First result keys:', Object.keys(results[0]));
        }
      })
    );
  }

  getStudentPerformanceData(): Observable<StudentPerformanceData> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');
    return this.http.get<StudentPerformanceData>(
      `${this.baseUrl}/students/dashboard/performance/${user.id}`
    );
  }

  getStudentCategoryPerformance(): Observable<CategoryPerformance> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');
    return this.http.get<CategoryPerformance>(
      `${this.baseUrl}/students/dashboard/category-performance/${user.id}`
    );
  }

  getStudentScoreDistribution(): Observable<number[]> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');
    return this.http.get<number[]>(
      `${this.baseUrl}/students/dashboard/score-distribution/${user.id}`
    );
  }

  getStudentExams(): Observable<ExamData[]> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');
    return this.http
      .get<ApiExamData[]>(`${this.baseUrl}/exams/student/${user.id}`)
      .pipe(
        map((apiExams) => apiExams.map((exam) => this.transformExamData(exam)))
      );
  }

  getExamQuestions(examId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/exams/${examId}/questions`);
  }

  submitExamAnswers(examId: number, answers: any): Observable<any> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');
    return this.http.post<any>(`${this.baseUrl}/exams/${examId}/submit`, {
      studentId: user.id,
      answers,
    });
  }

  takeExam(
    examId: number
  ): Observable<{ status: string; resultId: number; exam: ExamData }> {
    return this.http.get<{ status: string; resultId: number; exam: ExamData }>(
      `${this.baseUrl}/exams/take-exam/${examId}`
    );
  }

  submitExam(
    resultId: number,
    answers: { [questionId: number]: number }
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/exams/submit/${resultId}`, {
      answers,
    });
  }

  debugExamData(): Observable<ApiExamData[]> {
    return this.http.get<ApiExamData[]>(`${this.baseUrl}/exams`).pipe(
      tap((data) => {
        console.log('=== DEBUG: Raw API Response ===');
        console.log('Full response:', data);
        if (data && data.length > 0) {
          console.log('First exam structure:', data[0]);
          console.log('All keys in first exam:', Object.keys(data[0]));
        }
        console.log('=== END DEBUG ===');
      })
    );
  }

  getExamResult(resultId: number): Observable<any> {
    const user = this.authService.getUser();
    if (!user?.id) throw new Error('No user ID found');

    return this.http.get<any>(
      `${this.baseUrl}/exams/result/${resultId}/${user.id}`
    );
  }

  getUserById(userId: number): Observable<{ id: number; name: string }> {
    return this.http.get<{ id: number; name: string }>(`${this.baseUrl}/users/${userId}`);
  }

  getAllStudents() {
    return this.http.get<{ status: string; data: any[] }>(`${this.baseUrl}/users`).pipe(
      map(response => {
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response format:', response);
          return { data: [] };
        }

        // Filter only students and transform the data
        const students = response.data
          .filter(user => user.role === 'student')
          .map(student => ({
            id: student.id,
            name: student.name,
            email: student.email,
            role: student.role,
            examResults: student.examResults || {
              totalExams: 0,
              passedExams: 0,
              averageScore: 0
            }
          }));
        return { data: students };
      }),
      tap(response => {
        console.log('API Response for all students:', response);
      })
    );
  }

  deleteStudent(studentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/students/${studentId}`);
  }
}
