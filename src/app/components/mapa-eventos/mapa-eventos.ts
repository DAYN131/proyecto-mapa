// src/app/components/mapa-eventos/mapa-eventos.ts
import { Component, OnInit, Inject, PLATFORM_ID, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { EventoService, Evento } from '../../services/evento';
import { LugarService, Lugar } from '../../services/lugar';
import { forkJoin } from 'rxjs';

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
  capaZonas: any = null;
  
  private isBrowser: boolean;
  
  eventosReales: Evento[] = [];
  lugaresReales: Lugar[] = [];
  eventosConCoordenadas: any[] = [];
  
  loading: boolean = true;
  errorMessage: string = '';

  // Colores por tipo
  coloresPorTipo: { [key: string]: string } = {
    'concierto': '#E24B4A',
    'teatro': '#7F77DD',
    'festival': '#EF9F27',
    'taller': '#1D9E75',
    'exposicion': '#378ADD',
    'conferencia': '#9B59B6',
    'deportivo': '#3498DB'
  };

  // Iconos FontAwesome
  iconosPorTipo: { [key: string]: string } = {
    'concierto': 'fa-music',
    'teatro': 'fa-masks-theater',
    'festival': 'fa-star',
    'taller': 'fa-palette',
    'exposicion': 'fa-camera',
    'conferencia': 'fa-chalkboard-user',
    'deportivo': 'fa-futbol'
  };

  @HostListener('document:click', ['$event'])
  cerrarMenu(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.menuVisible = false;
    }
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private eventoService: EventoService,
    private lugarService: LugarService,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.cargarDatos();
    }
  }

  cargarDatos() {
    this.loading = true;

    forkJoin({
      eventos: this.eventoService.getEventos(),
      lugares: this.lugarService.getLugares()
    }).subscribe({
      next: (data) => {
        this.eventosReales = data.eventos;
        this.lugaresReales = data.lugares;
        
        this.eventosConCoordenadas = this.eventosReales
          .filter(evento => evento.lugar_id)
          .map(evento => {
            const lugar = this.lugaresReales.find(l => l.id === evento.lugar_id);
            return {
              ...evento,
              lat: lugar?.lat || null,
              lng: lugar?.lng || null,
              direccion: evento.direccion || lugar?.direccion || '',
              lugar_nombre: evento.lugar_nombre || lugar?.nombre || ''
            };
          })
          .filter(evento => evento.lat && evento.lng);
        
        console.log('Eventos cargados:', this.eventosReales.length);
        console.log('Eventos con coordenadas:', this.eventosConCoordenadas.length);
        
        this.loading = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.inicializarMapa();
        }, 200);
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = 'Error al cargar eventos';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalLugares() { this.menuVisible = false; this.router.navigate(['/lugares']); }
  abrirModalRegistroAsistentes() { this.menuVisible = false; this.router.navigate(['/registro-asistentes']); }
  abrirModalAsistentes() { this.menuVisible = false; this.router.navigate(['/asistentes']); }
  abrirModalTipos() { this.menuVisible = false; this.router.navigate(['/tipo-evento']); }
  abrirModalEventos() { this.menuVisible = false; this.router.navigate(['/eventos']); }
  abrirDashboard() { this.menuVisible = false; this.router.navigate(['/dashboard']); }
  abrirModalEstadisticas() { this.menuVisible = false; alert('Estadísticas - Próximamente'); }

  filtrarEventos(tipo: string) {
    this.filtroActivo = tipo;
    if (this.mapa) {
      this.actualizarMarcadores();
    }
  }

  mostrarOcultarSecciones() {
    this.mostrarSecciones = !this.mostrarSecciones;
    if (this.mapa) {
      if (this.mostrarSecciones && !this.capaZonas) {
        this.agregarZonasMapa();
      } else if (!this.mostrarSecciones && this.capaZonas) {
        this.mapa.removeLayer(this.capaZonas);
        this.capaZonas = null;
      }
    }
  }

  inicializarMapa() {
    if (!this.isBrowser || typeof L === 'undefined') {
      console.error('Leaflet no disponible');
      return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    if (this.mapa) {
      this.mapa.remove();
    }

    this.mapa = L.map('map').setView([19.4326, -99.1332], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapa);

    this.actualizarMarcadores();

    if (this.mostrarSecciones) {
      this.agregarZonasMapa();
    }

    setTimeout(() => {
      this.mapa.invalidateSize();
    }, 100);
  }

  agregarZonasMapa() {
    if (!this.mapa || typeof L === 'undefined') return;

    const zonas = [
      { nombre: 'Centro Histórico', coords: [[19.4326, -99.1332], [19.4400, -99.1200], [19.4250, -99.1250]], color: '#FF6B6B' },
      { nombre: 'Polanco', coords: [[19.4330, -99.2000], [19.4400, -99.1900], [19.4250, -99.1950]], color: '#4ECDC4' }
    ];

    zonas.forEach(zona => {
      const polygon = L.polygon(zona.coords, {
        color: zona.color,
        weight: 2,
        opacity: 0.7,
        fillColor: zona.color,
        fillOpacity: 0.15
      }).addTo(this.mapa);
      
      polygon.bindPopup(`<b>${zona.nombre}</b>`);
      
      if (!this.capaZonas) {
        this.capaZonas = L.layerGroup().addTo(this.mapa);
      }
      this.capaZonas.addLayer(polygon);
    });
  }

  actualizarMarcadores() {
    if (!this.mapa || typeof L === 'undefined') return;

    this.marcadores.forEach(m => this.mapa.removeLayer(m));
    this.marcadores = [];

    let eventosFiltrados = [...this.eventosConCoordenadas];
    
    if (this.filtroActivo !== 'todos') {
      eventosFiltrados = eventosFiltrados.filter(e => 
        e.tipo?.toLowerCase() === this.filtroActivo.toLowerCase()
      );
    }

    if (eventosFiltrados.length === 0) {
      return;
    }

    eventosFiltrados.forEach(evento => {
      const tipo = evento.tipo?.toLowerCase() || 'conferencia';
      const color = this.coloresPorTipo[tipo] || '#58C9B9';
      const iconoFont = this.iconosPorTipo[tipo] || 'fa-calendar-day';
      
      // Marcador con FontAwesome - ESTILO QUE SÍ FUNCIONA
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${color}; width:36px; height:36px; border-radius:50%; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;"><i class="fas ${iconoFont}" style="color:white; font-size:16px;"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([evento.lat, evento.lng], { icon: markerIcon })
        .addTo(this.mapa);

      // Popup con FontAwesome
      marker.bindPopup(`
        <div style="min-width:220px; font-family:'Segoe UI'">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; border-bottom:2px solid ${color}; padding-bottom:8px;">
            <i class="fas ${iconoFont}" style="font-size:24px; color:${color};"></i>
            <div>
              <b style="font-size:14px;">${evento.nombre}</b><br>
              <span style="background:${color}; color:white; padding:2px 8px; border-radius:12px; font-size:10px;">${evento.tipo || 'Evento'}</span>
            </div>
          </div>
          <div style="margin-bottom:5px;">
            <i class="fas fa-calendar-alt" style="color:#58C9B9; width:20px;"></i> ${evento.fecha || 'Fecha por definir'}
          </div>
          <div style="margin-bottom:5px;">
            <i class="fas fa-map-marker-alt" style="color:#FF6F61; width:20px;"></i> ${evento.direccion || evento.lugar_nombre || 'Ubicación no especificada'}
          </div>
          ${evento.hora_inicio ? `
          <div style="margin-bottom:5px;">
            <i class="fas fa-clock" style="color:#9B59B6; width:20px;"></i> ${evento.hora_inicio}
          </div>
          ` : ''}
          <div style="margin-top:10px; padding-top:8px; border-top:1px solid #eee; text-align:center;">
            <button onclick="window.location.href='/eventos'" style="background:${color}; color:white; border:none; padding:5px 12px; border-radius:20px; cursor:pointer; font-size:11px;">
              <i class="fas fa-info-circle"></i> Ver detalles
            </button>
          </div>
        </div>
      `, { maxWidth: 280 });

      this.marcadores.push(marker);
    });
  }
}