import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../chat.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-piyush',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './piyush.component.html',
  styleUrl: './piyush.component.css'
})
export class PiyushComponent {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  userInput = '';
  messages: { sender: string; text: string }[] = [];

  constructor(private chatService: ChatService) { }

  sendMessage() {
    if (!this.userInput.trim()) return;

    this.messages.push({ sender: 'user', text: this.userInput });

    this.chatService.sendMessage('piyush', this.userInput).subscribe(res => {
      this.messages.push({ sender: 'piyush', text: res.reply });
      this.scrollToBottom();
    });

    this.userInput = '';
    setTimeout(() => this.scrollToBottom(), 0);
  }


  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}

