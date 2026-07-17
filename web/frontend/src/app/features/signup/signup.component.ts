import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm: ['', [Validators.required]],
      },
      { validators: [this.matchPasswords] },
    );
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return pw && confirm && pw !== confirm ? { mismatch: true } : null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const { name, email, password } = this.form.value;

    this.authService.signup(name, email, password).subscribe({
      next: () => this.router.navigate(['/today']),
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Could not create account. Please try again.';
        this.loading = false;
      },
    });
  }
}
