import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-smcard',
  standalone: true,
  imports: [],
  templateUrl: './smcard.component.html',
  styleUrl: './smcard.component.css'
})
export class SmcardComponent  {
  @Input() title: string = '';
  @Input() count: string = '';
  @Input() description: string = '';
}
