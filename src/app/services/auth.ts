// src/app/services/auth.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface Usuario {
  email: string;
  rol: 'admin' | 'user';
  nombre: string;
}

interface UsuarioConPassword extends Usuario {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(null);
  usuarioActual$ = this.usuarioActualSubject.asObservable();
  private isBrowser: boolean;

  private usuarios: UsuarioConPassword[] = [
    { email: 'admin@eventos.com', password: 'admin123', rol: 'admin', nombre: 'Administrador' },
    { email: 'user@eventos.com', password: 'user123', rol: 'user', nombre: 'Usuario Normal' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Solo ejecutar en el navegador
    if (this.isBrowser) {
      const savedUser = localStorage.getItem('usuario');
      if (savedUser) {
        this.usuarioActualSubject.next(JSON.parse(savedUser));
      }
    }
  }

  login(email: string, password: string): boolean {
    const usuario = this.usuarios.find(u => u.email === email && u.password === password);
    if (usuario) {
      const { password, ...usuarioSinPassword } = usuario;
      this.usuarioActualSubject.next(usuarioSinPassword);
      
      // Solo guardar en localStorage si estamos en el navegador
      if (this.isBrowser) {
        localStorage.setItem('usuario', JSON.stringify(usuarioSinPassword));
      }
      return true;
    }
    return false;
  }

  logout(): void {
    this.usuarioActualSubject.next(null);
    
  
    if (this.isBrowser) {
      localStorage.removeItem('usuario');
    }
  }

  getUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  esAdmin(): boolean {
    return this.usuarioActualSubject.value?.rol === 'admin';
  }

  estaAutenticado(): boolean {
    return this.usuarioActualSubject.value !== null;
  }
}