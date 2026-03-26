// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MapaEventosComponent } from './components/mapa-eventos/mapa-eventos';
import { AsistentesComponent } from './components/asistentes/asistentes';
import { EventosComponent } from './components/eventos/eventos';

export const routes: Routes = [
  { path: '', redirectTo: '/mapa', pathMatch: 'full' },
{ path: 'mapa', component: MapaEventosComponent },
{ path: 'asistentes', component: AsistentesComponent },
{ path: 'eventos', component: EventosComponent },
];
