import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './faq.component.html',
})
export class FAQComponent implements OnInit {
  faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I take an exam?',
      answer: 'To take an exam, go to your dashboard and click on the "Available Exams" section. Select the exam you want to take and click "Start Exam". Make sure you have a stable internet connection and enough time to complete the exam.'
    },
    {
      category: 'Getting Started',
      question: 'What happens if I lose my internet connection during an exam?',
      answer: 'If you lose your internet connection during an exam, the system will automatically save your progress. Once you reconnect, you can continue from where you left off. However, please note that the exam timer will continue running.'
    },
    {
      category: 'Exam Rules',
      question: 'What are the rules for taking exams?',
      answer: 'The main rules include: 1) No switching browser tabs or windows during the exam, 2) No using external resources or materials, 3) Complete the exam within the allocated time, 4) Submit your answers before the time expires. Violating these rules may result in exam disqualification.'
    },
    {
      category: 'Exam Rules',
      question: 'Can I retake an exam if I fail?',
      answer: 'The ability to retake an exam depends on your instructor\'s settings. Some exams may allow retakes, while others may not. Check with your instructor or the exam details for specific retake policies.'
    },
    {
      category: 'Results & Grades',
      question: 'How are exam scores calculated?',
      answer: 'Exam scores are calculated based on the number of correct answers. Each question has a specific point value, and your final score is the sum of points earned divided by the total possible points, converted to a percentage.'
    },
    {
      category: 'Results & Grades',
      question: 'When will I receive my exam results?',
      answer: 'For most exams, you will receive your results immediately after submission. However, for exams that require manual grading or review, results may take up to 48 hours to be available.'
    },
    {
      category: 'Technical Issues',
      question: 'What should I do if I encounter technical issues?',
      answer: 'If you encounter technical issues, try refreshing your browser first. If the problem persists, contact your instructor immediately and provide details about the issue you\'re experiencing. Make sure to include any error messages you see.'
    },
    {
      category: 'Technical Issues',
      question: 'What browsers are supported?',
      answer: 'The exam platform works best with the latest versions of Chrome, Firefox, Safari, and Edge. We recommend using Chrome for the best experience. Make sure your browser is up to date before starting an exam.'
    }
  ];

  categories: string[] = ['Getting Started', 'Exam Rules', 'Results & Grades', 'Technical Issues'];
  selectedCategory: string = 'Getting Started';

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Help Center');
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Find answers to common questions about taking exams, exam rules, results, and technical support. Get help with getting started, exam procedures, and troubleshooting.'
    });
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'FAQ, frequently asked questions, exam help, exam rules, exam results, technical support, exam platform, student guide'
    });

  }



  private getCategoryDescription(category: string): string {
    const descriptions: { [key: string]: string } = {
      'Getting Started': 'Learn how to get started with the exam platform.',
      'Exam Rules': 'Understand the rules and guidelines for taking exams.',
      'Results & Grades': 'Get information about exam results and grading.',
      'Technical Issues': 'Find solutions to common technical problems.'
    };
    return descriptions[category] || 'Find answers to your questions.';
  }

  private getCategoryKeywords(category: string): string {
    const keywords: { [key: string]: string } = {
      'Getting Started': 'beginner guide, first exam, exam setup',
      'Exam Rules': 'exam guidelines, exam policies, exam requirements',
      'Results & Grades': 'exam scores, grade calculation, result analysis',
      'Technical Issues': 'technical support, troubleshooting, browser compatibility'
    };
    return keywords[category] || 'exam platform';
  }

  getFilteredFAQs(): FAQItem[] {
    return this.faqs.filter(faq => faq.category === this.selectedCategory);
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
  }
} 