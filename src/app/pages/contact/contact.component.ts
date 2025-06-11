import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { ExamService } from '../../services/exam.service';
import { ExamCountService } from '../../services/exam-count.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './contact.component.html',
})
export class ContactComponent implements OnInit {
  currentUser: any = null;
  teacherName: string = 'Teacher';

  constructor(
    private authService: AuthService,
    private examService: ExamService,
    private examCountService: ExamCountService,
    private titleService: Title,
    private metaService: Meta
  ) {
    this.initializeUserInfo();
  }

  ngOnInit() {
    // Set initial title and meta tags
    this.titleService.setTitle('Contact Us');
    this.metaService.updateTag({ name: 'description', content: 'Get in touch with our support team. Contact us for any questions, technical support, or assistance with the exam platform.' });
    this.metaService.updateTag({ name: 'keywords', content: 'contact support, exam platform support, technical assistance, help desk, contact form' });

    // Redirect if not a teacher
    if (this.currentUser?.role !== 'teacher') {
      window.location.href = '/dashboard';
    }
    this.loadExamsForCount();
  }

  private loadExamsForCount(): void {
    // Fetch exams for the admin exam count in the sidebar
    this.examService.getAllExamsForTeacher().subscribe(exams => {
      this.examCountService.updateAdminExamCount(exams?.length ?? 0);
    });
  }

  private initializeUserInfo() {
    this.currentUser = this.authService.getUser();
    if (this.currentUser) {
      this.teacherName = this.currentUser.name || 'Teacher';
    }
  }

} 