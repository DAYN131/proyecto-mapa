import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';

  constructor(private router: Router) {}

  async onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos.';
      return;
    }
    this.loading = true;
    this.error = '';

    // Simulación de login — aquí conectas tu servicio real
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/mapa']);
    }, 1500);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}