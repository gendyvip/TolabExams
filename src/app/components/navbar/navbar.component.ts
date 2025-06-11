import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  @ViewChild('dropdown') dropdown!: ElementRef;
  queryPath!: string;
  isDropdownOpen = false;
  @Input() userDetails: any
  @Input() logout!: () => void;
  user: any;

  @Input() isSidebarOpen = false;
  @Output() toggleState = new EventEmitter<boolean>();

  showLogoutAlert = false;

  constructor(private route: ActivatedRoute, private authService: AuthService) {
    this.authService.isLoggedInObservable().subscribe(() => {
      this.user = this.authService.currentUserValue;
    });
  }

  onToggle() {
    this.toggleState.emit(!this.isSidebarOpen);
  }

  ngOnInit(): void {
    this.queryPath = this.route.snapshot.url[0].path;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.dropdown.nativeElement.classList.remove('hidden');
      this.dropdown.nativeElement.classList.add('block');
    } else {
      this.dropdown.nativeElement.classList.add('hidden');
      this.dropdown.nativeElement.classList.remove('block');
    }
  }

  onRouting(): void {
    this.isDropdownOpen = false;
    this.dropdown.nativeElement.classList.add('hidden');
    this.dropdown.nativeElement.classList.remove('block');
  }

  handleLogout() {
    this.showLogoutAlert = true;
    this.isDropdownOpen = false;
    this.dropdown.nativeElement.classList.add('hidden');
    this.dropdown.nativeElement.classList.remove('block');
  }

  cancelLogout() {
    this.showLogoutAlert = false;
  }

  confirmLogout() {
    this.showLogoutAlert = false;
    this.logout();
  }

  getAvatarUrl(): string {
    if (this.user && this.user.avatar) {
      if (this.user.avatar.startsWith('http')) {
        return this.user.avatar;
      }
      return 'https://tolabexams-backend.onrender.com' + this.user.avatar;
    }
    // fallback image
    return 'https://flowbite.com/docs/images/people/profile-picture-5.jpg';
  }
}