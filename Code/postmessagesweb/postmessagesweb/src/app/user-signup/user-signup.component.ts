import { Component, OnInit } from '@angular/core';
import { UserHttpService, User } from '../user-http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-signup',
  templateUrl: './user-signup.component.html',
  styleUrls: ['./user-signup.component.css']
})
export class UserSignupComponent implements OnInit {

  public errmessage = undefined;
  public user:User = { mail: '', password: '', username: '', roles: [] };

  constructor( public us: UserHttpService, public router: Router ) { }

  ngOnInit() {
  }

  signup() {

    this.us.register( this.user ).subscribe( {
      next: (d) => {
      console.log('Registration ok: ' + JSON.stringify(d) );
      this.errmessage = undefined;
      this.router.navigate(['/login']);
     },
     error: (err) => {
      console.log('Signup error: ' + JSON.stringify(err.error.errormessage) );
      this.errmessage = err.error.errormessage || err.error.message;
    }});

  }

}
