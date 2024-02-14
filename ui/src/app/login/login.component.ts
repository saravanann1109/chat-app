import { CommonModule, NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [HttpClientModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  
  userName: string = '';
  constructor(public http: HttpClient,
    private route: Router) {}

  onSubmit() {

    if(!this.userName) {
      return;
    }

     this.http.get(`${environment.apiUrl}/user/${this.userName}`).subscribe((data: any)=>{
        localStorage.setItem("user", data.result);
        localStorage.setItem("userName", this.userName);
        this.route.navigate(["/"]);
     });
  }
}
