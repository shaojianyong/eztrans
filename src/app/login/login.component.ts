import {Component, OnInit} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormControl
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  myForm: FormGroup;
  errMsg: string;

  constructor(fb: FormBuilder, private router: Router) {
    this.myForm = fb.group({
      'username': ['', Validators.required],
      'password': ['', Validators.required],
    });
  }

  ngOnInit() {
  }

  onSubmit(form: any): void {
    console.log('You submitted value: ', form);
    this.errMsg = '';
    if (this.myForm.hasError('required', ['username'])
      || this.myForm.hasError('required', ['password'])) {
      this.errMsg = '需要输入用户和密码！';
      return;
    }

    // TODO: 调用electron主进程，验证密码

    this.router.navigate(['/main']);
  }
}
