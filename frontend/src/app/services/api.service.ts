import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) {}

  createRoom(): Observable<{ code: string }> {
    return this.http.post<{ code: string }>(
      `${this.baseUrl}/room/create`,
      {}
    );
  }
}
