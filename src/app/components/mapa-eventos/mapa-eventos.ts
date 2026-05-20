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
  cargandoSecciones: boolean = false;

  capaSecciones: any = null;
  mapa: any;
  marcadores: any[] = [];
  capaZonas: any = null;
  
  private isBrowser: boolean;
  
  eventosReales: Evento[] = [];
  lugaresReales: Lugar[] = [];
  eventosConCoordenadas: any[] = [];
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
        console.error(' Error cargando tipos de filtro:', error);
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
    
    this.cargandoSecciones = true;
    
    // 1. Primero obtener los colores por sección desde el backend
    this.eventoService.getColoresSecciones().subscribe({
      next: (coloresData) => {
        // Crear mapa rápido de colores por sección
        const coloresPorSeccion = new Map();
        coloresData.forEach((item: any) => {
          coloresPorSeccion.set(String(item.seccion), {
            color: item.color,
            asistentes: item.asistentes,
            nivel: item.nivel
          });
        });
        
        console.log('✅ Colores por sección cargados:', coloresPorSeccion.size);
        
        // 2. Cargar el GeoJSON de las secciones
        const geojsonUrl = 'http://localhost:8000/api/secciones-geojson';
        
        fetch(geojsonUrl)
          .then(response => response.json())
          .then((geojsonData: any) => {
            this.capaSecciones = L.geoJSON(geojsonData, {
              style: (feature: any) => {
                const seccion = String(feature?.properties?.seccion);
                const info = coloresPorSeccion.get(seccion) || { 
                  color: '#e0e0e0', 
                  asistentes: 0, 
                  nivel: 'Sin datos' 
                };
                
                return {
                  color: info.color,
                  weight: 1.2,
                  opacity: 0.8,
                  fillColor: info.color,
                  fillOpacity: 0.5
                };
              },
              onEachFeature: (feature: any, layer: any) => {
                const props = feature.properties;
                const seccion = String(props.seccion);
                const info = coloresPorSeccion.get(seccion) || { 
                  asistentes: 0, 
                  nivel: 'Sin datos', 
                  color: '#e0e0e0' 
                };
                
                // Popup con información
                layer.bindPopup(`
                  <div style="font-family:'Segoe UI'; min-width:220px;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; border-bottom:2px solid ${info.color}; padding-bottom:8px;">
                      <i class="fas fa-chart-line" style="font-size:20px; color:${info.color};"></i>
                      <div>
                        <b style="font-size:14px;">🗳️ Sección Electoral ${seccion}</b>
                      </div>
                    </div>
                    <div style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                      <i class="fas fa-users" style="width:25px; color:#58C9B9;"></i>
                      <span><strong>Participantes únicos:</strong> ${info.asistentes}</span>
                    </div>
                    <div style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                      <i class="fas fa-chart-simple" style="width:25px; color:#FF6F61;"></i>
                      <span><strong>Nivel de participación:</strong> 
                        <span style="background:${info.color}; padding:2px 10px; border-radius:15px; color:white; font-size:11px; margin-left:5px;">
                          ${info.nivel}
                        </span>
                      </span>
                    </div>
                    <div style="margin-top:10px; padding-top:8px; border-top:1px solid #eee; font-size:11px; color:#666;">
                      <i class="fas fa-info-circle"></i> Basado en asistentes únicos que han participado en eventos
                    </div>
                  </div>
                `);
                
                // Efecto hover
                layer.on('mouseover', () => {
                  layer.setStyle({
                    weight: 2.5,
                    fillOpacity: 0.75,
                    color: '#FFFFFF'
                  });
                });
                
                layer.on('mouseout', () => {
                  layer.setStyle({
                    weight: 1.2,
                    fillOpacity: 0.5,
                    color: info.color
                  });
                });
              }
            }).addTo(this.mapa);
            
            // Agregar leyenda al mapa
            this.agregarLeyenda(coloresData);
            
            this.cargandoSecciones = false;
            console.log('✅ Secciones electorales coloreadas por participación');
          })
          .catch((error) => {
            console.error('❌ Error cargando GeoJSON:', error);
            this.cargandoSecciones = false;
            this.mostrarErrorSecciones();
          });
      },
      error: (error) => {
        console.error(' Error cargando colores:', error);
        this.cargandoSecciones = false;
        this.mostrarErrorSecciones();
      }
    });
  }

  // Agregar leyenda al mapa
  agregarLeyenda(coloresData: any[]) {
    if (!this.mapa) return;
    
    // Encontrar los rangos únicos de niveles
    const niveles = [...new Set(coloresData.map((d: any) => d.nivel))];
    const coloresUnicos = coloresData.filter((d: any, index: number, self: any[]) => 
      self.findIndex((t: any) => t.nivel === d.nivel) === index
    );
    
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = `
       <div style="background:white; padding:12px 15px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.15); min-width:180px;">
          <div style="font-weight:bold; margin-bottom:10px; border-bottom:2px solid #58C9B9; padding-bottom:5px;">
            <i class="fas fa-chart-line"></i> Participación Cultural
          </div>
          <div style="display:flex; align-items:center; margin-bottom:8px;">
            <span style="background:#e53935; width:20px; height:20px; border-radius:4px; margin-right:10px;"></span>
            <span style="font-size:12px;">Muy alta (50+ asistentes)</span>
          </div>
          <div style="display:flex; align-items:center; margin-bottom:8px;">
            <span style="background:#ff7043; width:20px; height:20px; border-radius:4px; margin-right:10px;"></span>
            <span style="font-size:12px;">Alta (25-49 asistentes)</span>
          </div>
          <div style="display:flex; align-items:center; margin-bottom:8px;">
            <span style="background:#ffca28; width:20px; height:20px; border-radius:4px; margin-right:10px;"></span>
            <span style="font-size:12px;">Media (10-24 asistentes)</span>
          </div>
          <div style="display:flex; align-items:center; margin-bottom:8px;">
            <span style="background:#26c6da; width:20px; height:20px; border-radius:4px; margin-right:10px;"></span>
            <span style="font-size:12px;">Baja (3-9 asistentes)</span>
          </div>
          <div style="display:flex; align-items:center; margin-bottom:8px;">
            <span style="background:#42a5f5; width:20px; height:20px; border-radius:4px; margin-right:10px;"></span>
            <span style="font-size:12px;">Muy baja (1-2 asistentes)</span>
          </div>
          <div style="display:flex; align-items:center;">
            <span style="background:#90a4ae; width:20px; height:20px; border-radius:4px; margin-right:10px;"></span>
            <span style="font-size:12px;">Sin participación</span>
          </div>
        </div>
      `;
      return div;
    };
    
    legend.addTo(this.mapa);
  }

  // Mostrar error si no se pueden cargar las secciones
  mostrarErrorSecciones() {
    if (!this.mapa) return;
    
    L.popup()
      .setLatLng([19.4326, -99.1332])
      .setContent(`
        <div style="text-align:center; padding:10px;">
          <i class="fas fa-exclamation-triangle" style="font-size:24px; color:#FF6F61;"></i>
          <p style="margin:10px 0 0 0;">No se pudieron cargar las secciones electorales</p>
          <small>Verifica que el backend esté corriendo</small>
        </div>
      `)
      .openOn(this.mapa);
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