import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.sass']
})
export class TestComponent implements OnInit {

  constructor(private auth: AuthService) { }

  ngOnInit() {
    this.auth.authState$.subscribe((user) => {
      console.log(user);
    });
  }

}
