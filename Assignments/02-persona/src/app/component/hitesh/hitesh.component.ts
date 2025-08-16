import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-hitesh',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hitesh.component.html',
  styleUrl: './hitesh.component.css'
})
export class HiteshComponent {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  userInput = '';
  messages: { sender: string; text: string }[] = [];

  constructor(private chatService: ChatService) { }

  sendMessage() {
    if (!this.userInput.trim()) return;

    this.messages.push({ sender: 'user', text: this.userInput });

    this.chatService.sendMessage('hitesh', this.userInput).subscribe(res => {
      this.messages.push({ sender: 'hitesh', text: res.reply });
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
