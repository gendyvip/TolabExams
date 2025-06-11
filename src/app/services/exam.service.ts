import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Exam {
  id?: number;
  title: string;
  description: string;
  startDate: Date;
  durration: number;
  category?: string;
  status?: string;
  userId?: number;
  questions?: any[];
  questionsCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private baseUrl = 'https://tolabexams-backend.onrender.com/api/v1/exams';
  private questionBaseUrl = 'https://tolabexams-backend.onrender.com/api/v1/questions';

  constructor(private http: HttpClient) { }

  getAllExamsForTeacher(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/teacher`);
  }

  getAllExamsForStudent(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  createExam(exam: Exam): Observable<any> {
    return this.http.post(`${this.baseUrl}`, exam);
  }

  getExamById(examId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${examId}`);
  }

  updateExam(examId: number, examData: Partial<Exam>): Observable<Exam> {
    console.log(this.baseUrl);
    return this.http.patch<Exam>(`${this.baseUrl}/${examId}`, examData);
  }

  submitExam(
    resultId: number,
    answers: { [questionId: number]: number }
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/submit/${resultId}`, { answers });
  }

  deleteExam(examId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${examId}`);
  }

  updateQuestion(questionId: number, questionData: any): Observable<any> {
    return this.http.patch(`${this.questionBaseUrl}/${questionId}`, questionData);
  }

  deleteQuestion(questionId: number): Observable<any> {
    return this.http.delete(`${this.questionBaseUrl}/${questionId}`);
  }
}
