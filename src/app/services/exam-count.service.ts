import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExamCountService {
  private adminExamCountSubject = new BehaviorSubject<number>(0);
  private studentExamCountSubject = new BehaviorSubject<number>(0);
  
  adminExamCount$ = this.adminExamCountSubject.asObservable();
  studentExamCount$ = this.studentExamCountSubject.asObservable();

  updateAdminExamCount(count: number): void {
    this.adminExamCountSubject.next(count);
  }

  updateStudentExamCount(exams: any[]): void {
    console.log('=== DEBUG: Updating Student Exam Count ===');
    console.log('Total exams before filtering:', exams.length);
    
    // Count only exams that have at least one question
    const validExamsCount = exams.filter(exam => {
      // Check if the exam has questions in any of the possible formats
      const hasQuestions = 
        (exam.questions && exam.questions.length > 0) || 
        (exam.questionsCount && exam.questionsCount > 0) ||
        (exam.totalQuestions && exam.totalQuestions > 0);
      
      // Log for debugging
      console.log('Exam:', exam.title, 'Has questions:', hasQuestions, {
        questions: exam.questions?.length,
        questionsCount: exam.questionsCount,
        totalQuestions: exam.totalQuestions
      });
      
      return hasQuestions;
    }).length;

    console.log('Total valid exams after filtering:', validExamsCount);
    this.studentExamCountSubject.next(validExamsCount);
  }
} 