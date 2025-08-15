import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private http: HttpClient) { }

  sendMessageToHitesh(userMessage: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(
      'http://localhost:3000/api/chat/hitesh',
      { userMessage }
    );
  }

  sendMessageToPiyush(userMessage: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(
      'http://localhost:3000/api/chat/piyush',
      { userMessage }
    );
  }
}
