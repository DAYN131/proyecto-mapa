import { Component, signal } from '@angular/core';
import { MapaEventosComponent } from './components/mapa-eventos/mapa-eventos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MapaEventosComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('proyecto-mapa');
}
