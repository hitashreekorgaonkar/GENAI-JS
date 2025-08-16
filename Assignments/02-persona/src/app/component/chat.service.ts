import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  // Change this for deployed Vercel endpoint
  // private apiUrl = 'http://localhost:3000/api/chat';
  private apiUrl = 'https://genai-js-backend.vercel.app/api/chat';

  constructor(private http: HttpClient) { }

  sendMessage(
    persona: 'hitesh' | 'piyush',
    userMessage: string
  ): Observable<{ reply: string }> {
    console.log("this.apiUrl", this.apiUrl);
    return this.http.post<{ reply: string }>(this.apiUrl, {
      persona,
      userMessage,
    });
  }
}
