// admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface RecentResult {
  id: number;
  score: number;
  passed: boolean;
  createdAt: string;
  user: {
    name: string;
  };
  exam: {
    title: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'https://tolabexams-backend.onrender.com/api/v1/admin';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getDashboardStats(
    teacherId: number
  ): Observable<{ status: string; data: DashboardStats }> {
    return this.http.get<{ status: string; data: DashboardStats }>(
      `${this.apiUrl}/dashboard/stats/${teacherId}`,
      { headers: this.getHeaders() }
    );
  }

  getExamResults(examId?: number): Observable<ExamResult[]> {
    // If examId is provided, get results for specific exam
    // If examId is not provided or is null/undefined, get all exam results
    const url = examId
      ? `${this.apiUrl}/dashboard/exam-results/${examId}`
      : `${this.apiUrl}/dashboard/exam-results`;

    return this.http.get<ExamResult[]>(url, { headers: this.getHeaders() });
  }

  getRecentResults(
    examId?: number
  ): Observable<{ status: string; data: RecentResult[] }> {
    // Modified to also accept examId parameter for filtering recent results
    const url = examId
      ? `${this.apiUrl}/dashboard/recent-results/${examId}`
      : `${this.apiUrl}/dashboard/recent-results`;

    return this.http.get<{ status: string; data: RecentResult[] }>(url, {
      headers: this.getHeaders(),
    });
  }
}
