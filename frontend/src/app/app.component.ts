import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface AuthUrlResponse {
  url: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'frontend';

  constructor(private http: HttpClient) {}

  signIn() {
    this.http.get('/api/auth').subscribe((res: AuthUrlResponse) => {
      console.log(res.url);
      window.open(res.url);
    });
  }
}
