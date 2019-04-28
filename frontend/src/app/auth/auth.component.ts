import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.sass']
})
export class AuthComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private http: HttpClient) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe((params: ParamMap) => {
      console.log(params);
      this.http.post('/api/auth', {
        authorization_code: params.get('code')
      }).subscribe((res) => console.log(res));
    });
  }

}
