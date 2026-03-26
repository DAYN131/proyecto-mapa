import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

// Declarar variable L sin importar al inicio
declare let L: any;

@Component({
  selector: 'app-mapa-eventos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-eventos.html',
  styleUrls: ['./mapa-eventos.css']
})
export class MapaEventosComponent implements OnInit {
  // Propiedades del menú
  menuVisible: boolean = false;

  // Propiedades del modal
  modalVisible: boolean = false;
  eventoSeleccionado: any = null;

  // Propiedades de filtros
  filtroActivo: string = 'todos';
  mostrarSecciones: boolean = true;

  // Mapa
  mapa: any;
  marcadores: any[] = [];
  private isBrowser: boolean;

  // Datos de ejemplo
  eventos: any[] = [
    {
      id: 1,
      nombre: 'Concierto Rock',
      tipo: 'concierto',
      fecha: '2024-04-15',
      descripcion: 'Gran concierto de rock',
      lat: 19.4326,
      lng: -99.1332
    },
    {
      id: 2,
      nombre: 'Obra de Teatro',
      tipo: 'teatro',
      fecha: '2024-04-20',
      descripcion: 'Obra teatral',
      lat: 19.4326,
      lng: -99.1332
    },
    {
      id: 3,
      nombre: 'Festival de Música',
      tipo: 'festival',
      fecha: '2024-05-01',
      descripcion: 'Festival de música electrónica',
      lat: 19.4326,
      lng: -99.1332
    },
    {
      id: 4,
      nombre: 'Taller de Arte',
      tipo: 'taller',
      fecha: '2024-04-25',
      descripcion: 'Taller de pintura',
      lat: 19.4326,
      lng: -99.1332
    },
    {
      id: 5,
      nombre: 'Exposición de Fotografía',
      tipo: 'exposicion',
      fecha: '2024-04-18',
      descripcion: 'Exposición de fotografía urbana',
      lat: 19.4326,
      lng: -99.1332
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    if (this.isBrowser) {
      // Esperar a que Leaflet esté disponible (ya está cargado en index.html o por CDN)
      await this.cargarLeafletSiEsNecesario();
      this.inicializarMapa();
    }
  }

  private async cargarLeafletSiEsNecesario() {
    // Si Leaflet no está disponible, cargarlo dinámicamente
    if (typeof L === 'undefined') {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        resolve(true);
      };
      document.head.appendChild(script);
      });
    }
    return true;
  }

  // Método para alternar el menú
  toggleMenu() {
    this.menuVisible = !this.menuVisible;
  }

  // Métodos para abrir modales
  abrirModalEventos() {
    this.modalVisible = true;
    this.eventoSeleccionado = null;
  }

  abrirModalAsistentes() {
    this.modalVisible = true;
    this.eventoSeleccionado = null;
  }

  abrirModalEstadisticas() {
    this.modalVisible = true;
    this.eventoSeleccionado = null;
  }

  // Método para cerrar modal
  cerrarModal() {
    this.modalVisible = false;
    this.eventoSeleccionado = null;
  }

  // Método para filtrar eventos
  filtrarEventos(tipo: string) {
    this.filtroActivo = tipo;
    if (this.isBrowser) {
      this.actualizarMapa();
    }
  }

  // Método para mostrar/ocultar secciones
  mostrarOcultarSecciones() {
    this.mostrarSecciones = !this.mostrarSecciones;
  }

  // Método para actualizar el mapa según filtros
  actualizarMapa() {
    if (!this.isBrowser || !this.mapa || typeof L === 'undefined') return;

    // Limpiar marcadores existentes
    this.marcadores.forEach(marcador => {
      this.mapa.removeLayer(marcador);
    });
    this.marcadores = [];

    // Filtrar eventos según el filtro activo
    const eventosFiltrados = this.filtroActivo === 'todos'
    ? this.eventos
    : this.eventos.filter(e => e.tipo === this.filtroActivo);

    // Agregar nuevos marcadores
    eventosFiltrados.forEach(evento => {
      const marker = L.marker([evento.lat, evento.lng]).addTo(this.mapa);
      marker.bindPopup(`
      <b>${evento.nombre}</b><br>
      ${evento.descripcion}<br>
      <b>Fecha:</b> ${evento.fecha}<br>
      <b>Tipo:</b> ${evento.tipo}
      `);
      this.marcadores.push(marker);

      // Evento click en marcador
      marker.on('click', () => {
        this.eventoSeleccionado = evento;
        this.modalVisible = true;
      });
    });
  }

  getEventoIcon(tipo: string): string {
    // Lógica para devolver el nombre del icono, por ejemplo:
    if (tipo === 'fiesta') return 'party-icon';
    return 'default-icon';
  }

  // Método para inicializar el mapa
  inicializarMapa() {
    if (!this.isBrowser || typeof L === 'undefined') return;

    // Esperar a que el DOM esté listo
    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (mapElement && typeof L !== 'undefined') {
        // Configurar el mapa
        this.mapa = L.map('map').setView([19.4326, -99.1332], 12);

        // Agregar capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(this.mapa);

        // Agregar marcadores iniciales
        this.actualizarMapa();

        // Manejar redimensionamiento de ventana
        window.addEventListener('resize', () => {
          if (this.mapa) {
            this.mapa.invalidateSize();
          }
        });
      }
    }, 100);
  }

  // Método para crear icono personalizado
  crearIconoPersonalizado(color: string = 'red'): any {
    if (!this.isBrowser || typeof L === 'undefined') return null;

    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
                     iconSize: [20, 20],
                     popupAnchor: [0, -10]
    });
  }
}
