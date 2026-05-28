// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Ingresa correo y contraseña';
      return;
    }

    this.loading = true;
    this.error = '';

    // Simular delay
    setTimeout(() => {
      const success = this.authService.login(this.email, this.password);
      
      if (success) {
        const usuario = this.authService.getUsuarioActual();
        if (usuario?.rol === 'admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/mapa-eventos']);
        }
      } else {
        this.error = 'Correo o contraseña incorrectos';
      }
      this.loading = false;
    }, 500);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}