// src/app/components/mapa-eventos/mapa-eventos.ts
import { Component, OnInit, Inject, PLATFORM_ID,HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

declare let L: any;

@Component({
  selector: 'app-mapa-eventos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-eventos.html',
  styleUrls: ['./mapa-eventos.css']
})


export class MapaEventosComponent implements OnInit {

  menuVisible: boolean = false;
  filtroActivo: string = 'todos';
  mostrarSecciones: boolean = true;

  mapa: any;
  marcadores: any[] = [];
  private isBrowser: boolean;
  
  @HostListener('document:click', ['$event'])
  cerrarMenu(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.menuVisible = false;
    }
  }

  eventos: any[] = [
    // Conciertos
    {
      id: 1,
      nombre: 'Concierto Rock Nacional',
      tipo: 'concierto',
      fecha: '2024-05-10',
      descripcion: 'Los mejores grupos de rock mexicano en un solo escenario.',
      lugar: 'Foro Sol, CDMX',
      lat: 19.3574,
      lng: -99.0855
    },
    {
      id: 2,
      nombre: 'Noche de Jazz',
      tipo: 'concierto',
      fecha: '2024-05-18',
      descripcion: 'Una velada íntima con los mejores jazzistas del país.',
      lugar: 'El Plaza Condesa, CDMX',
      lat: 19.4103,
      lng: -99.1722
    },
    // Teatro
    {
      id: 3,
      nombre: 'Obra: La Casa de Bernarda Alba',
      tipo: 'teatro',
      fecha: '2024-05-12',
      descripcion: 'Clásico de Federico García Lorca en una producción contemporánea.',
      lugar: 'Teatro de los Insurgentes, CDMX',
      lat: 19.3762,
      lng: -99.1703
    },
    {
      id: 4,
      nombre: 'Comedia: ¡Qué familia!',
      tipo: 'teatro',
      fecha: '2024-05-20',
      descripcion: 'Una obra de comedia ligera para toda la familia.',
      lugar: 'Teatro Hidalgo, CDMX',
      lat: 19.4354,
      lng: -99.1437
    },
    // Festivales
    {
      id: 5,
      nombre: 'Festival Coordenada',
      tipo: 'festival',
      fecha: '2024-06-01',
      descripcion: 'Festival de música indie y alternativa con artistas nacionales e internacionales.',
      lugar: 'Expo Guadalajara',
      lat: 20.6597,
      lng: -103.3496
    },
    {
      id: 6,
      nombre: 'Festival de Cultura Urbana',
      tipo: 'festival',
      fecha: '2024-05-25',
      descripcion: 'Arte urbano, música y gastronomía en el corazón de la ciudad.',
      lugar: 'Parque Bicentenario, CDMX',
      lat: 19.4454,
      lng: -99.2011
    },
    // Talleres
    {
      id: 7,
      nombre: 'Taller de Acuarela',
      tipo: 'taller',
      fecha: '2024-05-15',
      descripcion: 'Aprende técnicas básicas y avanzadas de pintura en acuarela.',
      lugar: 'Centro Cultural Bella Época, CDMX',
      lat: 19.4124,
      lng: -99.1691
    },
    {
      id: 8,
      nombre: 'Taller de Escritura Creativa',
      tipo: 'taller',
      fecha: '2024-05-22',
      descripcion: 'Desarrolla tu voz narrativa con ejercicios prácticos guiados.',
      lugar: 'Biblioteca Vasconcelos, CDMX',
      lat: 19.4474,
      lng: -99.1509
    },
    // Exposiciones
    {
      id: 9,
      nombre: 'Exposición: Frida & Diego',
      tipo: 'exposicion',
      fecha: '2024-05-01',
      descripcion: 'Muestra de obras y fotografías históricas de dos íconos del arte mexicano.',
      lugar: 'Museo Frida Kahlo, CDMX',
      lat: 19.3552,
      lng: -99.1627
    },
    {
      id: 10,
      nombre: 'Fotografía Contemporánea MX',
      tipo: 'exposicion',
      fecha: '2024-05-08',
      descripcion: 'Selección de los mejores fotógrafos mexicanos de la última década.',
      lugar: 'Centro de la Imagen, CDMX',
      lat: 19.4285,
      lng: -99.1364
    }
  ];





  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
              private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    if (this.isBrowser) {
      await this.cargarLeafletSiEsNecesario();
      this.inicializarMapa();
    }
  }

  // ──────────────────────────────────────────────
  // Menú
  // ──────────────────────────────────────────────

  onMenuButtonClick(event: Event) {
    event.stopPropagation();
    this.menuVisible = !this.menuVisible;
  }

  abrirModalLugares() {
    this.menuVisible = false;
    this.router.navigate(['/lugares']);
  }

  abrirModalAsistentes() {
    this.menuVisible = false;
    this.router.navigate(['/asistentes']);
  }

  abrirModalEventos() {
    this.menuVisible = false;
    this.router.navigate(['/eventos']);
  }

  abrirDashboard() {
    this.menuVisible = false;
    this.router.navigate(['/dashboard']);
  }

  abrirModalEstadisticas() {
    this.menuVisible = false;
    alert('Estadísticas - Próximamente');
  }

  // ──────────────────────────────────────────────
  // Filtros — solo actualizan marcadores en el mapa
  // ──────────────────────────────────────────────

  filtrarEventos(tipo: string) {
    this.filtroActivo = tipo;
    if (this.isBrowser) {
      this.actualizarMarcadores();
    }
  }

  mostrarOcultarSecciones() {
    this.mostrarSecciones = !this.mostrarSecciones;
  }

  // ──────────────────────────────────────────────
  // Mapa
  // ──────────────────────────────────────────────

  private async cargarLeafletSiEsNecesario(): Promise<any> {
    if (typeof L !== 'undefined') return true;

    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve(true);
      document.head.appendChild(script);
    });
  }

  inicializarMapa() {
    if (!this.isBrowser || typeof L === 'undefined') return;

    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (!mapElement) return;

      this.mapa = L.map('map').setView([19.4326, -99.1332], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.mapa);

      this.actualizarMarcadores();

      window.addEventListener('resize', () => {
        this.mapa?.invalidateSize();
      });
    }, 100);
  }

  actualizarMarcadores() {
    if (!this.isBrowser || !this.mapa || typeof L === 'undefined') return;

    // Limpiar marcadores anteriores
    this.marcadores.forEach(m => this.mapa.removeLayer(m));
    this.marcadores = [];

    const eventosFiltrados = this.filtroActivo === 'todos'
    ? this.eventos
    : this.eventos.filter(e => e.tipo === this.filtroActivo);

    eventosFiltrados.forEach(evento => {
      const icono = this.crearIconoTipo(evento.tipo);

      const marker = L.marker([evento.lat, evento.lng], { icon: icono })
      .addTo(this.mapa);

      // Solo popup nativo de Leaflet — sin modal, sin estado compartido
      marker.bindPopup(`
      <div style="min-width:200px; font-family: sans-serif;">
      <div style="font-weight:600; font-size:14px; margin-bottom:4px;">
      ${this.getEmojiTipo(evento.tipo)} ${evento.nombre}
      </div>
      <div style="font-size:12px; color:#555; margin-bottom:6px;">
      📍 ${evento.lugar}
      </div>
      <div style="font-size:12px; margin-bottom:4px;">
      🗓️ ${evento.fecha}
      </div>
      <div style="font-size:12px; color:#333;">
      ${evento.descripcion}
      </div>
      <div style="margin-top:6px;">
      <span style="
      display:inline-block;
      padding:2px 8px;
      border-radius:12px;
      font-size:11px;
      font-weight:600;
      background:${this.getColorTipo(evento.tipo)};
      color:#fff;
      ">${evento.tipo}</span>
      </div>
      </div>
      `, { maxWidth: 260 });

      this.marcadores.push(marker);
    });
  }

  // ──────────────────────────────────────────────
  // Helpers de íconos y colores por tipo
  // ──────────────────────────────────────────────

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

  crearIconoTipo(tipo: string): any {
    if (typeof L === 'undefined') return null;

    const color = this.getColorTipo(tipo);
    const emoji = this.getEmojiTipo(tipo);

    return L.divIcon({
      className: '',
      html: `
      <div style="
      background:${color};
      width:36px; height:36px;
      border-radius:50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;
      ">
      <span style="transform:rotate(45deg); font-size:16px; line-height:1;">
      ${emoji}
      </span>
      </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38]
    });
  }

  getEventoIcon(tipo: string): string {
    const map: { [k: string]: string } = {
      concierto:  'fa-music',
      teatro:     'fa-masks-theater',
      festival:   'fa-star',
      taller:     'fa-palette',
      exposicion: 'fa-camera',
    };
    return map[tipo] ?? 'fa-calendar-days';
  }
}
