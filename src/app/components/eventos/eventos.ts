import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoService } from '../../services/evento';
import { TipoEventoService, TipoEvento } from '../../services/tipo-evento';
import { LugarService } from '../../services/lugar';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eventos.html',
  styleUrls: ['./eventos.css']
})
export class EventosComponent implements OnInit {
  // Datos principales
  eventos: any[] = [];
  tipos: TipoEvento[] = [];
  lugares: any[] = [];
  
  // Filtros y búsqueda
  busqueda: string = '';
  filtroTabla: string = 'todos';
  
  // UI states
  mostrarFormulario: boolean = false;
  cargando: boolean = false;
  
  // Nuevo evento
  nuevoEvento: any = {
    nombre: '',
    tipo_id: null,
    fecha: '',
    lugar: '',
    lat: null,
    lng: null,
    descripcion: ''
  };

  // Propiedad computada para los tipos del filtro
  get tiposFiltro(): any[] {
    return ['todos', ...this.tipos];
  }

  constructor(
    private eventoService: EventoService,
    private tipoService: TipoEventoService,
    private lugarService: LugarService
  ) {}

  ngOnInit() {
    this.cargarTodosLosDatos();
  }

  cargarTodosLosDatos() {
    this.cargando = true;
    
    Promise.all([
      this.cargarEventos(),
      this.cargarTipos(),
      this.cargarLugares()
    ]).finally(() => {
      this.cargando = false;
    });
  }

  cargarEventos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventoService.getEventos().subscribe({
        next: (data) => {
          console.log('Eventos cargados:', data);
          this.eventos = data.map((ev: any) => ({
            id: ev.id,
            nombre: ev.nombre,
            tipo: ev.tipo,
            fecha: ev.fecha,
            lugar: this.obtenerLugarPorEvento(ev.id),
            descripcion: ev.descripcion || 'Sin descripción',
            lat: ev.lat,
            lng: ev.lng
          }));
          resolve();
        },
        error: (err) => {
          console.error('Error cargando eventos:', err);
          reject(err);
        }
      });
    });
  }

  cargarTipos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tipoService.getTipos().subscribe({
        next: (data) => {
          console.log('Tipos cargados:', data);
          this.tipos = data;
          resolve();
        },
        error: (err) => {
          console.error('Error cargando tipos:', err);
          reject(err);
        }
      });
    });
  }

  cargarLugares(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.lugarService.getLugares().subscribe({
        next: (data) => {
          console.log('Lugares cargados:', data);
          this.lugares = data;
          resolve();
        },
        error: (err) => {
          console.error('Error cargando lugares:', err);
          reject(err);
        }
      });
    });
  }

  obtenerLugarPorEvento(eventoId: number): string {
    // Aquí puedes implementar lógica para obtener el lugar del evento
    // Por ahora retorna un texto dummy
    const lugar = this.lugares.find(l => l.evento_id === eventoId);
    return lugar ? lugar.nombre : 'Por asignar';
  }

  // Eventos filtrados
  get eventosFiltrados() {
    let filtrados = this.eventos;
    
    // Filtrar por tipo
    if (this.filtroTabla !== 'todos') {
      filtrados = filtrados.filter(e => e.tipo === this.filtroTabla);
    }
    
    // Filtrar por búsqueda
    if (this.busqueda) {
      const busq = this.busqueda.toLowerCase();
      filtrados = filtrados.filter(e => 
        e.nombre.toLowerCase().includes(busq) || 
        (e.lugar && e.lugar.toLowerCase().includes(busq))
      );
    }
    
    return filtrados;
  }

  abrirFormulario() {
    this.nuevoEvento = {
      nombre: '',
      tipo_id: null,
      fecha: '',
      lugar: '',
      lat: null,
      lng: null,
      descripcion: ''
    };
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.cargando = false;
  }
// components/eventos/eventos.ts - CORREGIDO
// Reemplaza el método agregarEvento() con este:

agregarEvento() {
    // Validaciones
    if (!this.nuevoEvento.nombre) {
        alert('❌ El nombre del evento es obligatorio');
        return;
    }
    if (!this.nuevoEvento.tipo_id) {
        alert('❌ Debes seleccionar un tipo de evento');
        return;
    }
    if (!this.nuevoEvento.fecha) {
        alert('❌ La fecha es obligatoria');
        return;
    }
    if (!this.nuevoEvento.lugar) {
        alert('❌ El lugar es obligatorio');
        return;
    }

    this.cargando = true;
    
    // CORREGIDO: Usar la estructura correcta para Lugar
    const lugarData = {
        nombre: this.nuevoEvento.lugar,
        direccion: this.nuevoEvento.direccion || '',  // Añadir dirección
        lat: this.nuevoEvento.lat || 0,               // lat en lugar de latitud
        lng: this.nuevoEvento.lng || 0,               // lng en lugar de longitud
        gmapslink: `https://www.google.com/maps?q=${this.nuevoEvento.lat || 0},${this.nuevoEvento.lng || 0}` // URL por defecto
    };

    console.log('Enviando lugarData:', lugarData); // Debug

    this.lugarService.crearLugar(lugarData).subscribe({
        next: (lugarCreado) => {
            console.log('Lugar creado:', lugarCreado);
            
            // Luego crear el evento
            const eventoData = {
                nombre: this.nuevoEvento.nombre,
                fecha: this.nuevoEvento.fecha,
                tipo_id: this.nuevoEvento.tipo_id,
                lugar_id: lugarCreado.id,
                descripcion: this.nuevoEvento.descripcion
            };
            
            this.eventoService.crearEvento(eventoData).subscribe({
                next: (response) => {
                    console.log('Evento creado:', response);
                    alert('✅ Evento creado exitosamente');
                    this.cerrarFormulario();
                    this.cargarEventos();
                    this.cargando = false;
                },
                error: (err) => {
                    console.error('Error al crear evento:', err);
                    alert('❌ Error al crear el evento: ' + (err.error?.detail || err.message));
                    this.cargando = false;
                }
            });
        },
        error: (err) => {
            console.error('Error al crear lugar:', err);
            alert('❌ Error al crear el lugar: ' + (err.error?.detail || err.message));
            this.cargando = false;
        }
    });
}

  eliminarEvento(id: number) {
    if (confirm('¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.')) {
      console.log('Eliminar evento:', id);
      alert('🚧 Funcionalidad de eliminar en desarrollo');
      // Aquí llamarías a un endpoint DELETE cuando lo tengas
    }
  }

  // Helpers visuales
  getColorTipo(tipo: string): string {
    const colores: {[key: string]: string} = {
      'Fiesta': '#FF6B6B',
      'Conferencia': '#4ECDC4',
      'Taller': '#45B7D1',
      'Reunión': '#96CEB4',
      'Concierto': '#FFEAA7',
      'Deportes': '#FF9F43',
      'Cultural': '#A29BFE',
      'default': '#DFE6E9'
    };
    return colores[tipo] || colores['default'];
  }
}