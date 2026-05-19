import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoService, Evento } from '../../services/evento';
import { AsistenteService, Asistente } from '../../services/asistente';
import { EventoAsistenteService, RegistroEvento } from '../../services/evento_asistente';

@Component({
    selector: 'app-evento-asistente',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './evento-asistente.html',
    styleUrls: ['./evento-asistente.css']
})
export class RegistroAsistentesComponent implements OnInit {
    eventos: Evento[] = [];
    asistentes: Asistente[] = [];
    registros: RegistroEvento[] = [];
    
    // 🔍 Variables para búsqueda
    busquedaEvento: string = '';
    eventosFiltrados: any[] = [];
    
    nuevoRegistro = {
        evento_id: 0,
        asistente_id: 0
    };
    
    loading = false;
    errorMessage = '';
    successMessage = '';
    
    constructor(
        private eventoService: EventoService,
        private asistenteService: AsistenteService,
        private registroService: EventoAsistenteService,
        private cdr: ChangeDetectorRef
    ) {}
    
    ngOnInit() {
        this.cargarDatos();
    }
    
    get totalRegistros(): number {
        return this.registros.length;
    }
    
    get registrosPorEvento(): any[] {
        const grupos = new Map();
        
        for (const registro of this.registros) {
            if (!grupos.has(registro.evento)) {
                grupos.set(registro.evento, {
                    evento: registro.evento,
                    fecha_evento: registro.fecha_evento,
                    hora_evento: registro.hora_evento,
                    asistentes: []
                });
            }
            
            grupos.get(registro.evento).asistentes.push({
                id: registro.id,
                asistente_nombre: registro.asistente,
                asistente_email: registro.asistente_email,
                asistente_telefono: registro.asistente_telefono,
                asistente_seccion: registro.asistente_seccion,
                fecha_registro: registro.fecha_registro
            });
        }
        
        return Array.from(grupos.values());
    }
    
    // 🔍 Filtrar eventos por nombre
    filtrarEventos() {
        if (!this.busquedaEvento || this.busquedaEvento.trim() === '') {
            this.eventosFiltrados = [...this.registrosPorEvento];
        } else {
            const busquedaLower = this.busquedaEvento.toLowerCase().trim();
            this.eventosFiltrados = this.registrosPorEvento.filter(grupo => 
                grupo.evento.toLowerCase().includes(busquedaLower)
            );
        }
        this.cdr.markForCheck();
    }
    
    // 🔍 Limpiar búsqueda
    limpiarBusqueda() {
        this.busquedaEvento = '';
        this.filtrarEventos();
        this.cdr.markForCheck();
    }
    
    cargarDatos() {
        this.loading = true;
        this.cdr.markForCheck();
        
        // Cargar eventos, asistentes y registros en paralelo
        Promise.all([
            this.cargarEventos(),
            this.cargarAsistentes(),
            this.cargarRegistros()
        ]).finally(() => {
            this.loading = false;
            this.cdr.markForCheck();
        });
    }
    
    cargarEventos(): Promise<void> {
        return new Promise((resolve) => {
            this.eventoService.getEventos().subscribe({
                next: (data) => {
                    this.eventos = data;
                    resolve();
                },
                error: (error) => {
                    console.error('Error:', error);
                    this.mostrarError('Error al cargar eventos');
                    resolve();
                }
            });
        });
    }
    
    cargarAsistentes(): Promise<void> {
        return new Promise((resolve) => {
            this.asistenteService.getAsistentes().subscribe({
                next: (data) => {
                    this.asistentes = data;
                    resolve();
                },
                error: (error) => {
                    console.error('Error:', error);
                    this.mostrarError('Error al cargar asistentes');
                    resolve();
                }
            });
        });
    }
    
    cargarRegistros(): Promise<void> {
        return new Promise((resolve) => {
            this.registroService.getRegistros().subscribe({
                next: (data) => {
                    this.registros = data;
                    this.filtrarEventos(); // Actualizar filtros
                    resolve();
                },
                error: (error) => {
                    console.error('Error:', error);
                    this.mostrarError('Error al cargar registros');
                    resolve();
                }
            });
        });
    }
    
    registrar() {
        if (!this.nuevoRegistro.evento_id || !this.nuevoRegistro.asistente_id) {
            this.mostrarError(' Selecciona un evento y un asistente');
            return;
        }
        
        this.loading = true;
        this.cdr.markForCheck();
        
        this.registroService.registrarAsistente(this.nuevoRegistro).subscribe({
            next: () => {
                this.mostrarExito(' Asistente registrado exitosamente');
                this.nuevoRegistro = { evento_id: 0, asistente_id: 0 };
                this.cargarRegistros();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error:', error);
                this.mostrarError(error.error?.detail || ' Error al registrar');
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }
    
    eliminarRegistro(id: number, nombreAsistente: string, nombreEvento: string) {
        if (confirm(`¿Eliminar a "${nombreAsistente}" del evento "${nombreEvento}"?`)) {
            this.loading = true;
            this.cdr.markForCheck();
            
            this.registroService.eliminarRegistro(id).subscribe({
                next: () => {
                    this.mostrarExito(` ${nombreAsistente} eliminado del evento`);
                    this.cargarRegistros();
                    this.loading = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error:', error);
                    this.mostrarError(' Error al eliminar registro');
                    this.loading = false;
                    this.cdr.markForCheck();
                }
            });
        }
    }
    
    mostrarError(mensaje: string) {
        this.errorMessage = mensaje;
        this.cdr.markForCheck();
        setTimeout(() => {
            this.errorMessage = '';
            this.cdr.markForCheck();
        }, 5000);
    }
    
    mostrarExito(mensaje: string) {
        this.successMessage = mensaje;
        this.cdr.markForCheck();
        setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
        }, 3000);
    }
    
    trackById(index: number, item: any): number {
        return item.id || index;
    }
}