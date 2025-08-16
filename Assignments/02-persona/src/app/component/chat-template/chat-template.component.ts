import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-template.component.html',
  styleUrl: './chat-template.component.css'
})
export class ChatTemplateComponent implements AfterViewChecked {
  persona: 'hitesh' | 'piyush' = 'hitesh'; // default
  messages: { sender: string; text: string }[] = [];
  userInput: string = '';
  isTyping: boolean = false;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(private chatService: ChatService) { }

  setPersona(selected: 'hitesh' | 'piyush') {
    this.persona = selected;
    this.messages = []; // reset chat when switching
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    // push user message
    this.messages.push({ sender: 'user', text: this.userInput });
    const input = this.userInput;
    this.userInput = '';

    // show typing...
    this.isTyping = true;

    // call backend
    this.chatService.sendMessage(this.persona, input).subscribe({
      next: (res) => {
        this.isTyping = false; // stop typing indicator
        this.messages.push({ sender: this.persona, text: res.reply });
      },
      error: (err) => {
        this.isTyping = false; // stop typing indicator
        this.messages.push({
          sender: this.persona,
          text: '⚠️ Error: Could not get reply',
        });
        console.error(err);
      },
    });
  }


  // Auto-scroll logic
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
