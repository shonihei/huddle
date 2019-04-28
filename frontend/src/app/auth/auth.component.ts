import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.sass']
})
export class AuthComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private auth: AuthService) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe((params: ParamMap) => {
      console.log(params);
      this.auth.authenticate(params.get('code'));
    });
  }

}
