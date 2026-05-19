// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MapaEventosComponent } from './components/mapa-eventos/mapa-eventos';
import { AsistentesComponent } from './components/asistentes/asistentes';
import { EventosComponent } from './components/eventos/eventos';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import {LugaresComponent} from './components/lugares/lugares';
import { TipoEventoComponent } from './components/tipo-evento/tipo-evento';
import { RegistroAsistentesComponent } from './components/evento-asistente/evento-asistente';

export const routes: Routes = [
{ path: '', redirectTo: 'login', pathMatch: 'full' },
{ path: 'mapa', component: MapaEventosComponent },
{ path: 'asistentes', component: AsistentesComponent },
{ path: 'eventos', component: EventosComponent },
{ path: 'login', component: LoginComponent },
{ path: 'lugares', component: LugaresComponent },
{ path: 'dashboard', component: DashboardComponent },
{ path: 'tipo-evento', component: TipoEventoComponent },
{ path: 'registro-asistentes', component: RegistroAsistentesComponent },
];
