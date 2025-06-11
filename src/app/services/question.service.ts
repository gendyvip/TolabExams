import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Question {
  id?: number;
  title: string;
  options: string[];
  points: number;
  answer: number;
  examId: number;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private baseUrl = `https://tolabexams-backend.onrender.com/api/v1/questions`;

  constructor(private http: HttpClient) { }

  getQuestions(examId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.baseUrl}/${examId}`);
  }

  addQuestions(examId: number, questions: Question[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/${examId}`, { questions });
  }

  updateQuestion(question: Question): Observable<Question> {
    return this.http.patch<Question>(
      `${this.baseUrl}/${question.id}`,
      question
    );
  }

  deleteQuestion(questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${questionId}`);
  }
}
