import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-sing-up',
  imports: [RouterLink, FormsModule],
  templateUrl: './sing-up.html',
  styleUrl: './sing-up.css',
})
export class SingUp {
  email = signal('');
  isShaking = signal(false);
  submit(form: NgForm) {
    if (form.invalid) {
      this.triggerShake();
    } else {
      console.log('Form Submitted!', this.email());
    }
  }
  triggerShake() {
    this.isShaking.set(true);
    setTimeout(() => {
      this.isShaking.set(false);
    }, 400);
  }
}
