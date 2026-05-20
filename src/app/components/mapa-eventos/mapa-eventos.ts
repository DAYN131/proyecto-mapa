// src/app/components/mapa-eventos/mapa-eventos.ts
import { Component, OnInit, Inject, PLATFORM_ID, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { EventoService, Evento,TipoFiltro  } from '../../services/evento';
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
  mostrarSeccionesElectorales: boolean = false;

  capaSecciones: any = null;
  mapa: any;
  marcadores: any[] = [];
  capaZonas: any = null;
  
  private isBrowser: boolean;
  
  eventosReales: Evento[] = [];
  lugaresReales: Lugar[] = [];
  eventosConCoordenadas: any[] = [];
  
  // ✅ NUEVO: Lista de tipos para los filtros (viene del backend)
  tiposFiltro: TipoFiltro[] = [];
  
  loading: boolean = true;
  errorMessage: string = '';

  coloresPorTipo: { [key: string]: string } = {
    'concierto': '#E24B4A',
    'teatro': '#7F77DD',
    'festival': '#EF9F27',
    'taller': '#1D9E75',
    'exposicion': '#378ADD',
    'conferencia': '#9B59B6',
    'deportivo': '#3498DB'
  };

  iconosPorTipo: { [key: string]: string } = {
    'concierto': 'fa-music',
    'teatro': 'fa-masks-theater',
    'festival': 'fa-star',
    'taller': 'fa-palette',
    'exposicion': 'fa-camera',
    'conferencia': 'fa-chalkboard-user',
    'deportivo': 'fa-futbol'
  };

  // Mapeo de iconos para los filtros
  iconosFiltros: { [key: string]: string } = {
    'concierto': 'fas fa-music',
    'teatro': 'fas fa-masks-theater',
    'festival': 'fas fa-star',
    'taller': 'fas fa-palette',
    'exposicion': 'fas fa-camera',
    'conferencia': 'fas fa-chalkboard-user',
    'deportivo': 'fas fa-futbol',
    'todos': 'fas fa-globe-americas'
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
      this.cargarTiposFiltro(); 
    }
  }

  cargarTiposFiltro() {
    this.eventoService.getTiposParaFiltros().subscribe({
      next: (tipos) => {
        this.tiposFiltro = tipos;
        this.cdr.detectChanges();
        console.log(' Tipos para filtros cargados:', this.tiposFiltro);
      },
      error: (error) => {
        console.error('❌ Error cargando tipos de filtro:', error);
        // Fallback: usar tipos por defecto
        this.tiposFiltro = [
          { valor: 'concierto', nombre: 'Concierto' },
          { valor: 'teatro', nombre: 'Teatro' },
          { valor: 'festival', nombre: 'Festival' },
          { valor: 'taller', nombre: 'Taller' },
          { valor: 'exposicion', nombre: 'Exposición' }
        ];
      }
    });
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

  // ============================================
  // MENÚ
  // ============================================
  abrirModalLugares() { this.menuVisible = false; this.router.navigate(['/lugares']); }
  abrirModalRegistroAsistentes() { this.menuVisible = false; this.router.navigate(['/registro-asistentes']); }
  abrirModalAsistentes() { this.menuVisible = false; this.router.navigate(['/asistentes']); }
  abrirModalTipos() { this.menuVisible = false; this.router.navigate(['/tipo-evento']); }
  abrirModalEventos() { this.menuVisible = false; this.router.navigate(['/eventos']); }
  abrirDashboard() { this.menuVisible = false; this.router.navigate(['/dashboard']); }
  abrirModalEstadisticas() { this.menuVisible = false; alert('Estadísticas - Próximamente'); }

  // ============================================
  // FILTROS
  // ============================================
  filtrarEventos(tipo: string) {
    this.filtroActivo = tipo;
    if (this.mapa) {
      this.actualizarMarcadores();
    }
  }

  // ============================================
  // MOSTRAR/OCULTAR SECCIONES ELECTORALES
  // ============================================
  toggleSeccionesElectorales() {
    this.mostrarSeccionesElectorales = !this.mostrarSeccionesElectorales;
    
    if (this.mostrarSeccionesElectorales && !this.capaSecciones) {
      this.cargarSeccionesElectorales();
    } else if (!this.mostrarSeccionesElectorales && this.capaSecciones) {
      this.mapa.removeLayer(this.capaSecciones);
      this.capaSecciones = null;
    }
  }

  cargarSeccionesElectorales() {
    if (!this.mapa || typeof L === 'undefined') return;
    
    const geojsonUrl = 'http://localhost:8000/api/secciones-geojson';
    
    fetch(geojsonUrl)
      .then(response => response.json())
      .then((data: any) => {
        console.log('✅ GeoJSON cargado:', data);
        
        const colores = [
          '#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF',
          '#44FFFF', '#FF8844', '#88FF44', '#4488FF', '#FF4488',
          '#88FF88', '#FF8888', '#8888FF', '#FFFF88', '#FF88FF'
        ];
        
        this.capaSecciones = L.geoJSON(data, {
          style: (feature: any) => {
            const seccion = feature?.properties?.seccion || 0;
            const color = colores[seccion % colores.length];
            
            return {
              color: color,
              weight: 1.5,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.4
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            const props = feature.properties;
            const seccion = props.seccion || 0;
            const color = colores[seccion % colores.length];
            
            layer.bindPopup(`
              <div style="font-family:'Segoe UI'; min-width:180px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; border-bottom:2px solid ${color}; padding-bottom:5px;">
                  <i class="fas fa-map-pin" style="color:${color}; font-size:16px;"></i>
                  <b style="font-size:14px;">🗳️ Sección ${props.seccion}</b>
                </div>
                <div style="margin-bottom:5px;">
                  <i class="fas fa-map-marked-alt" style="color:#666; width:25px;"></i>
                  <strong>Distrito Federal:</strong> ${props.distrito_f}
                </div>
                <div style="margin-bottom:5px;">
                  <i class="fas fa-map-pin" style="color:#666; width:25px;"></i>
                  <strong>Distrito Local:</strong> ${props.distrito_l}
                </div>
                <div>
                  <i class="fas fa-tag" style="color:#666; width:25px;"></i>
                  <strong>Tipo:</strong> ${props.tipo === 2 ? '🏙️ Urbana' : '🌾 Rural'}
                </div>
              </div>
            `);
            
            layer.on('mouseover', () => {
              layer.setStyle({
                weight: 3,
                fillOpacity: 0.7,
                color: '#FFFFFF'
              });
            });
            
            layer.on('mouseout', () => {
              layer.setStyle({
                weight: 1.5,
                fillOpacity: 0.4,
                color: color
              });
            });
          }
        }).addTo(this.mapa);
        
        console.log(' Secciones electorales cargadas');
      })
      .catch((error: any) => {
        console.error(' Error:', error);
      });
  }

  // ============================================
  // MAPA Y MARCADORES
  // ============================================
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

    setTimeout(() => {
      this.mapa.invalidateSize();
    }, 100);
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
      
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${color}; width:36px; height:36px; border-radius:50%; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;"><i class="fas ${iconoFont}" style="color:white; font-size:16px;"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([evento.lat, evento.lng], { icon: markerIcon })
        .addTo(this.mapa);

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