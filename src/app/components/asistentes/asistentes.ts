// src/app/components/asistentes/asistentes.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asistentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asistentes.html',
  styleUrls: ['./asistentes.css']
})
export class AsistentesComponent implements OnInit {
  asistentes: any[] = [];

  ngOnInit() {
    this.cargarAsistentes();
  }

  cargarAsistentes() {
    // Datos de ejemplo
    this.asistentes = [
      { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', eventosAsistidos: 5, avatar: '👨' },
      { id: 2, nombre: 'María García', email: 'maria@example.com', eventosAsistidos: 3, avatar: '👩' },
      { id: 3, nombre: 'Carlos López', email: 'carlos@example.com', eventosAsistidos: 8, avatar: '🧑' }
    ];
  }

  agregarAsistente() {
    const nuevoAsistente = {
      id: this.asistentes.length + 1,
      nombre: 'Nuevo Asistente',
      email: 'nuevo@example.com',
      eventosAsistidos: 0,
      avatar: '👤'
    };
    this.asistentes.push(nuevoAsistente);
    alert('Asistente agregado (demo)');
  }

  verDetalle(asistente: any) {
    alert(`Detalle de ${asistente.nombre}\nEmail: ${asistente.email}\nEventos asistidos: ${asistente.eventosAsistidos}`);
  }

  eliminarAsistente(id: number) {
    if (confirm('¿Estás seguro de eliminar este asistente?')) {
      this.asistentes = this.asistentes.filter(a => a.id !== id);
      alert('Asistente eliminado');
    }
  }
}
