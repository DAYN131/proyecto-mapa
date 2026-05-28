// src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.esAdmin()) {
      return true;
    }
    this.router.navigate(['/mapa-eventos']);
    return false;
  }
}