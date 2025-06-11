import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ResultsComponent } from './pages/results/results.component';
import { LayoutComponent } from './layout/layout.component';
import { ExamComponent } from './pages/exam/exam.component';
import { ResultComponent } from './pages/result/result.component';
import { AdminComponent } from './pages/admin/admin/admin.component';
import { AdminManageComponent } from './pages/admin/admin-manage/admin-manage.component';
import { AdminResultsComponent } from './pages/admin/admin-results/admin-results.component';
import { AddExamComponent } from './pages/admin/add-exam/add-exam.component';
import { EditExamComponent } from './pages/admin/edit-exam/edit-exam.component';
import { ExamsComponent } from './pages/exams/exams.component';
import { ExamStartComponent } from './pages/exam-start/exam-start.component';
import { CheatingReportsComponent } from './pages/admin/cheating-reports/cheating-reports.component';
import { ContactComponent } from './pages/contact/contact.component';
import { StudentGuard } from './guards/student.guard';
import { TeacherGuard } from './guards/teacher.guard';
import { StudentManagementComponent } from './pages/admin/student-management/student-management.component';
import { FAQComponent } from './pages/student/faq/faq.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: RegisterComponent },
  {
    path: '',
    redirectTo: '/student/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'student',
    redirectTo: '/student/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'teacher',
    redirectTo: '/teacher/dashboard',
    pathMatch: 'full',
  },
   {
    path: 'teacher/cheating',
    redirectTo: '/teacher/cheating/logs',
    pathMatch: 'full',
  },
  {
    path: 'student',
    component: LayoutComponent,
    canActivate: [StudentGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'results', component: ResultsComponent },
      { path: 'results/:id', component: ResultComponent },
      { path: 'exams', component: ExamsComponent },
      { path: 'exams/:id', component: ExamComponent },
      { path: 'exams/:id/start', component: ExamStartComponent },
      { path: 'help', component: FAQComponent },
    ],
  },
  {
    path: 'teacher',
    component: LayoutComponent,
    canActivate: [TeacherGuard],
    children: [
      { path: 'dashboard', component: AdminComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'manage', component: AdminManageComponent },
      { path: 'tolab/results', component: AdminResultsComponent },
      { path: 'manage/addexam', component: AddExamComponent },
      { path: 'manage/editexam/:id', component: EditExamComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'tolab', component: StudentManagementComponent },
      { path: 'cheating/logs', component: CheatingReportsComponent },
    ],
  },
];
