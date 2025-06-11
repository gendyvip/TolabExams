import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Input() userDetails: any;
  @Input() queryPath: string = '';
  @Input() examLength: number = 0;
  @Input() logout!: () => void;
  @Output() closeSidebar = new EventEmitter<void>();

  showLogoutAlert = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void { }

  handleLogout() {
    this.showLogoutAlert = true;
  }

  cancelLogout() {
    this.showLogoutAlert = false;
  }

  confirmLogout() {
    this.showLogoutAlert = false;
    this.logout();
  }

  getAvatarUrl(): string {
    if (this.userDetails && this.userDetails.avatar) {
      if (this.userDetails.avatar.startsWith('http')) {
        return this.userDetails.avatar;
      }
      return 'https://tolabexams-backend.onrender.com' + this.userDetails.avatar;
    }
    return 'https://flowbite.com/docs/images/people/profile-picture-5.jpg';
  }
}
