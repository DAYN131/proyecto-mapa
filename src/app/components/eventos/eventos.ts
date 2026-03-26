import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eventos.html',
  styleUrls: ['./eventos.css']
})
export class EventosComponent {

  mostrarFormulario = false;

  tipos = ['concierto', 'teatro', 'festival', 'taller', 'exposicion'];

  nuevoEvento = {
    nombre: '',
    tipo: 'concierto',
    fecha: '',
    lugar: '',
    descripcion: '',
    lat: null as number | null,
    lng: null as number | null
  };

  eventos: any[] = [
    {
      id: 1, nombre: 'Concierto Rock Nacional', tipo: 'concierto',
      fecha: '2024-05-10', lugar: 'Foro Sol, CDMX',
      descripcion: 'Los mejores grupos de rock mexicano.', lat: 19.3574, lng: -99.0855
    },
    {
      id: 2, nombre: 'Noche de Jazz', tipo: 'concierto',
      fecha: '2024-05-18', lugar: 'El Plaza Condesa, CDMX',
      descripcion: 'Una velada íntima con los mejores jazzistas.', lat: 19.4103, lng: -99.1722
    },
    {
      id: 3, nombre: 'La Casa de Bernarda Alba', tipo: 'teatro',
      fecha: '2024-05-12', lugar: 'Teatro de los Insurgentes, CDMX',
      descripcion: 'Clásico de García Lorca en versión contemporánea.', lat: 19.3762, lng: -99.1703
    },
    {
      id: 4, nombre: 'Comedia: ¡Qué familia!', tipo: 'teatro',
      fecha: '2024-05-20', lugar: 'Teatro Hidalgo, CDMX',
      descripcion: 'Comedia ligera para toda la familia.', lat: 19.4354, lng: -99.1437
    },
    {
      id: 5, nombre: 'Festival Coordenada', tipo: 'festival',
      fecha: '2024-06-01', lugar: 'Expo Guadalajara',
      descripcion: 'Festival de música indie y alternativa.', lat: 20.6597, lng: -103.3496
    },
    {
      id: 6, nombre: 'Festival de Cultura Urbana', tipo: 'festival',
      fecha: '2024-05-25', lugar: 'Parque Bicentenario, CDMX',
      descripcion: 'Arte urbano, música y gastronomía.', lat: 19.4454, lng: -99.2011
    },
    {
      id: 7, nombre: 'Taller de Acuarela', tipo: 'taller',
      fecha: '2024-05-15', lugar: 'Centro Cultural Bella Época, CDMX',
      descripcion: 'Técnicas básicas y avanzadas de acuarela.', lat: 19.4124, lng: -99.1691
    },
    {
      id: 8, nombre: 'Taller de Escritura Creativa', tipo: 'taller',
      fecha: '2024-05-22', lugar: 'Biblioteca Vasconcelos, CDMX',
      descripcion: 'Desarrolla tu voz narrativa.', lat: 19.4474, lng: -99.1509
    },
    {
      id: 9, nombre: 'Exposición: Frida & Diego', tipo: 'exposicion',
      fecha: '2024-05-01', lugar: 'Museo Frida Kahlo, CDMX',
      descripcion: 'Obras y fotografías de dos íconos del arte mexicano.', lat: 19.3552, lng: -99.1627
    },
    {
      id: 10, nombre: 'Fotografía Contemporánea MX', tipo: 'exposicion',
      fecha: '2024-05-08', lugar: 'Centro de la Imagen, CDMX',
      descripcion: 'Los mejores fotógrafos mexicanos de la última década.', lat: 19.4285, lng: -99.1364
    }
  ];

  // Filtro de tabla
  filtroTabla = 'todos';
  busqueda = '';

  get eventosFiltrados() {
    return this.eventos.filter(e => {
      const coincideTipo = this.filtroTabla === 'todos' || e.tipo === this.filtroTabla;
      const coincideBusqueda = e.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
      || e.lugar.toLowerCase().includes(this.busqueda.toLowerCase());
      return coincideTipo && coincideBusqueda;
    });
  }

  getColorTipo(tipo: string): string {
    const map: { [k: string]: string } = {
      concierto:  '#E24B4A',
      teatro:     '#7F77DD',
      festival:   '#EF9F27',
      taller:     '#1D9E75',
      exposicion: '#378ADD',
    };
    return map[tipo] ?? '#888';
  }

  getEmojiTipo(tipo: string): string {
    const map: { [k: string]: string } = {
      concierto:  '🎵',
      teatro:     '🎭',
      festival:   '🎪',
      taller:     '🎨',
      exposicion: '📷',
    };
    return map[tipo] ?? '📅';
  }

  abrirFormulario() {
    this.mostrarFormulario = true;
    this.resetFormulario();
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.resetFormulario();
  }

  resetFormulario() {
    this.nuevoEvento = {
      nombre: '', tipo: 'concierto', fecha: '',
      lugar: '', descripcion: '', lat: null, lng: null
    };
  }

  agregarEvento() {
    if (!this.nuevoEvento.nombre || !this.nuevoEvento.fecha || !this.nuevoEvento.lugar) return;

    this.eventos.push({
      ...this.nuevoEvento,
      id: this.eventos.length + 1
    });

    this.cerrarFormulario();
  }

  eliminarEvento(id: number) {
    this.eventos = this.eventos.filter(e => e.id !== id);
  }
}
