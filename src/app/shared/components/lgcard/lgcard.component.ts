import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lgcard',
  imports: [RouterLink,CommonModule],
  templateUrl: './lgcard.component.html',
  styleUrl: './lgcard.component.css'
})
export class LgcardComponent {
  @Input() results:Array<{id: number,title:string; completedAgo: string ; questionsCount: number ; scoreText: string,scorePercent: number}> = [];
  @Input() id: number = 0;
  @Input() title: string = '';
  @Input() completedAgo: string = '';
  @Input() questionsCount: number = 0;
  @Input() scoreText: string = '';
  @Input() scorePercent: number = 0;
  
}

