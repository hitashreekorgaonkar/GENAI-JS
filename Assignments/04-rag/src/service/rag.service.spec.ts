import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface IndexPayload {
  pdf?: File;
  csv?: File;
  websiteUrl?: string;
  textContent?: string;
}

interface ChatPayload {
  query: string;
}

@Injectable({
  providedIn: 'root'
})
export class RagService {
  private BASE_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  /** Index documents on backend */
  indexDocuments(payload: IndexPayload): Observable<any> {
    const formData = new FormData();

    if (payload.pdf) formData.append('pdfFile', payload.pdf);
    if (payload.csv) formData.append('csvFile', payload.csv);
    if (payload.websiteUrl) formData.append('websiteUrl', payload.websiteUrl);
    if (payload.textContent) formData.append('textContent', payload.textContent);

    return this.http.post(`${this.BASE_URL}/index`, formData);
  }

  /** Send query to backend chat */
  chat(query: string): Observable<any> {
    const payload: ChatPayload = { query };
    return this.http.post(`${this.BASE_URL}/chat`, payload);
  }
}
