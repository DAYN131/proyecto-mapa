// src/app/components/eventos/eventos.component.ts
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoService, Evento, TipoEvento, Lugar } from '../../services/evento';

@Component({
    selector: 'app-eventos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './eventos.html',
    styleUrls: ['./eventos.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventosComponent implements OnInit {
    eventos: Evento[] = [];
    tipos: TipoEvento[] = [];
    lugares: Lugar[] = [];
    
    nuevoEvento: Evento = {
        nombre: '',
        fecha: '',
        hora_inicio: '',
        tipo_id: undefined,
        lugar_id: 0
    };
    
    loading = false;
    errorMessage = '';
    successMessage = '';
    editandoId: number | null = null;
    
    constructor(
        private eventoService: EventoService,
        private cdr: ChangeDetectorRef
    ) { }
    
    ngOnInit(): void {
        this.cargarDatos();
    }
    
    cargarDatos(): void {
        this.loading = true;
        this.cdr.markForCheck();
        
        this.eventoService.getEventos().subscribe({
            next: (data) => {
                this.eventos = data;
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error:', error);
                this.mostrarError('Error al cargar eventos');
            }
        });
        
        this.eventoService.getTiposEvento().subscribe({
            next: (data) => {
                this.tipos = data;
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error:', error);
                this.mostrarError('Error al cargar tipos');
            }
        });
        
        this.eventoService.getLugares().subscribe({
            next: (data) => {
                this.lugares = data;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error:', error);
                this.mostrarError('Error al cargar lugares');
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }
    
    registrarEvento(): void {
        if (!this.nuevoEvento.nombre || !this.nuevoEvento.fecha || !this.nuevoEvento.lugar_id) {
            this.mostrarError(' Los campos nombre, fecha y lugar son obligatorios');
            return;
        }
        
        this.loading = true;
        this.cdr.markForCheck();
        
        this.eventoService.crearEvento(this.nuevoEvento).subscribe({
            next: (respuesta) => {
                this.mostrarExito(` Evento "${this.nuevoEvento.nombre}" creado`);
                this.resetFormulario();
                this.cargarDatos();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error:', error);
                this.mostrarError(error.error?.detail || ' Error al crear el evento');
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }
    
    editarEvento(evento: Evento): void {
        this.editandoId = evento.id!;
        this.nuevoEvento = {
            nombre: evento.nombre,
            fecha: evento.fecha,
            hora_inicio: evento.hora_inicio || '',
            tipo_id: evento.tipo_id,
            lugar_id: evento.lugar_id
        };
        this.cdr.detectChanges();
        
        document.querySelector('.form-card')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    actualizarEvento(): void {
        if (!this.nuevoEvento.nombre || !this.nuevoEvento.fecha || !this.nuevoEvento.lugar_id) {
            this.mostrarError('Los campos nombre, fecha y lugar son obligatorios');
            return;
        }
        
        this.loading = true;
        this.cdr.markForCheck();
        
        this.eventoService.actualizarEvento(this.editandoId!, this.nuevoEvento).subscribe({
            next: () => {
                this.mostrarExito(` Evento "${this.nuevoEvento.nombre}" actualizado`);
                this.resetFormulario();
                this.cancelarEdicion();
                this.cargarDatos();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error:', error);
                this.mostrarError(error.error?.detail || ' Error al actualizar');
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }
    
    eliminarEvento(id: number, nombre: string): void {
        if (confirm(`¿Eliminar evento "${nombre}"?`)) {
            this.loading = true;
            this.cdr.markForCheck();
            
            this.eventoService.eliminarEvento(id).subscribe({
                next: (respuesta) => {
                    this.mostrarExito(respuesta.mensaje || ` Evento "${nombre}" eliminado`);
                    this.cargarDatos();
                    this.loading = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error:', error);
                    this.mostrarError(error.error?.detail || ' Error al eliminar');
                    this.loading = false;
                    this.cdr.markForCheck();
                }
            });
        }
    }
    
    cancelarEdicion(): void {
        this.editandoId = null;
        this.resetFormulario();
        this.cdr.detectChanges();
    }
    
    resetFormulario(): void {
        this.nuevoEvento = {
            nombre: '',
            fecha: '',
            hora_inicio: '',
            tipo_id: undefined,
            lugar_id: 0
        };
        this.cdr.detectChanges();
    }
    
    mostrarError(mensaje: string): void {
        this.errorMessage = mensaje;
        this.cdr.markForCheck();
        setTimeout(() => {
            this.errorMessage = '';
            this.cdr.markForCheck();
        }, 5000);
    }
    
    mostrarExito(mensaje: string): void {
        this.successMessage = mensaje;
        this.cdr.markForCheck();
        setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
        }, 3000);
    }
    
    trackById(index: number, evento: Evento): number {
        return evento.id || index;
    }
}