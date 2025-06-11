import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FocusModeService {
  private focusModeSubject = new BehaviorSubject<boolean>(false);
  focusMode$ = this.focusModeSubject.asObservable();

  setFocusMode(value: boolean) {
    this.focusModeSubject.next(value);
  }
  getFocusMode() {
    return this.focusModeSubject.value;
  }
}