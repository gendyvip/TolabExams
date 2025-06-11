import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Result {
  id: number;
  userId: number;
  examId: number;
  score: number;
  passed: boolean;
  createdAt: string;
  user: { id: number; name: string };
  exam: { id: number; title: string };
}

export interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  totalQuestions: number;
  overallPassRate: number;
}

export interface ExamResult {
  id: number;
  totalAttempts: number;
  passedAttempts: number;
  averageScore: number;
  exam: {
    id: number;
    title: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ResultService {
  private baseUrl = 'https://tolabexams-backend.onrender.com/api/v1';
  private userKey = 'auth_user';

  constructor(private http: HttpClient) { }

  private getCurrentUserId(): number | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user).id : null;
  }

  getAllResults(): Observable<Result[]> {
    return this.http.get<Result[]>(
      `${this.baseUrl}/admin/dashboard/recent-results`
    );
  }

  getDashboardStats(): Observable<DashboardStats> {
    const teacherId = this.getCurrentUserId();
    if (!teacherId) throw new Error('No user ID found in localStorage');
    return this.http.get<DashboardStats>(
      `${this.baseUrl}/admin/dashboard/stats/${teacherId}`
    );
  }

  getExamResults(examId?: string): Observable<ExamResult[]> {
    const url = examId
      ? `${this.baseUrl}/admin/dashboard/exam-results/${examId}`
      : `${this.baseUrl}/admin/dashboard/exam-results`;
    return this.http.get<ExamResult[]>(url);
  }

  getRecentResults(): Observable<Result[]> {
    return this.http.get<Result[]>(
      `${this.baseUrl}/admin/dashboard/recent-results`
    );
  }
}
