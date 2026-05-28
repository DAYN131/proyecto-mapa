// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MapaEventosComponent } from './components/mapa-eventos/mapa-eventos';
import { AsistentesComponent } from './components/asistentes/asistentes';
import { EventosComponent } from './components/eventos/eventos';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { LugaresComponent } from './components/lugares/lugares';
import { TipoEventoComponent } from './components/tipo-evento/tipo-evento';
import { RegistroAsistentesComponent } from './components/evento-asistente/evento-asistente';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Página de login 
  { path: 'login', component: LoginComponent },
  
  // Redirección por defecto
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Rutas solo para ADMIN 
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'asistentes', 
    component: AsistentesComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'eventos', 
    component: EventosComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'lugares', 
    component: LugaresComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'tipo-evento', 
    component: TipoEventoComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'registro-asistentes', 
    component: RegistroAsistentesComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  
  { 
    path: 'mapa', 
    component: MapaEventosComponent,
    canActivate: [AuthGuard]
  },
  
  // Redirección para rutas no encontradas
  { path: '**', redirectTo: '/mapa' }
];