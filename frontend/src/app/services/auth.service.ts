import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, ReplaySubject } from 'rxjs';
import * as moment from 'moment';

interface AuthenticatedUserName {
  displayName: string;
  familyName: string;
  givenName: string;
}

export interface AuthenticatedUser {
  email: string;
  profileImgUrl: string;
  token: string;
  name: AuthenticatedUserName;
}

interface AuthResponse {
  expiresIn: number;
  user: AuthenticatedUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInUser: AuthenticatedUser;

  private authState = new ReplaySubject<AuthenticatedUser>(1);
  authState$ = this.authState.asObservable();

  constructor(private http: HttpClient) { 
    this.http.get('/api/auth/status', {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.getToken()}`,
      })
    }).subscribe((res: AuthResponse) => {
      this.loggedInUser = res.user;
      this.authState.next(res.user);

      this.setSession(res);
    });
  }

  authenticate(code: string): void {
    this.http.post('/api/auth', {
      authorization_code: code,
    }).subscribe((res: AuthResponse) => {
      this.loggedInUser = res.user;
      this.authState.next(res.user);

      this.setSession(res);
    });
  }

  private setSession(res: AuthResponse) {
    const expiresAt = moment().add(res.expiresIn, 'seconds');

    localStorage.setItem('id_token', res.user.token);
    localStorage.setItem('expires_at', JSON.stringify(expiresAt.valueOf()));
  }

  getToken() {
    return localStorage.getItem('id_token');
  }
}
