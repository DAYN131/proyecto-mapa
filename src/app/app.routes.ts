import { Routes } from '@angular/router';
import { MapaEventosComponent } from './components/mapa-eventos/mapa-eventos';

export const routes: Routes = [
  { path: '', component: MapaEventosComponent },
{ path: '**', redirectTo: '' }
];
