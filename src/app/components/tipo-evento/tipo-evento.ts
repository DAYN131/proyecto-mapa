import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoEventoService, TipoEvento } from '../../services/tipo-evento';

@Component({
  selector: 'app-tipo-evento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-evento.html',
  styleUrls: ['./tipo-evento.css'],
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class TipoEventoComponent implements OnInit {
  // Lista de tipos
  tipos: TipoEvento[] = [];
  
  // Modelo para el formulario
  nuevoTipo: TipoEvento = {
    nombre: ''
  };
  
  // Estado del componente
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Variable para identificar si estamos editando
  editandoId: number | null = null;

  constructor(
    private tipoEventoService: TipoEventoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarTipos();
  }

  // Cargar todos los tipos desde el backend
  cargarTipos(): void {
    this.loading = true;
    this.cdr.markForCheck();  
    
    this.tipoEventoService.getTipos().subscribe({
      next: (data) => {
        this.tipos = [...data];  
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = ' Error al cargar los tipos de evento';
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    });
  }

  // Preparar formulario para editar un tipo
  editarTipo(tipo: TipoEvento): void {
    this.editandoId = tipo.id!;
    this.nuevoTipo = {
      nombre: tipo.nombre
    };
    this.cdr.detectChanges();
    
    // Scroll suave al formulario
    document.querySelector('.form-card')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }

  // Actualizar un tipo existente
  actualizarTipo(): void {
    // Validaciones
    if (!this.nuevoTipo.nombre || this.nuevoTipo.nombre.trim() === '') {
      this.errorMessage = ' El nombre del tipo es obligatorio';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cdr.detectChanges();

    this.tipoEventoService.actualizarTipo(this.editandoId!, this.nuevoTipo).subscribe({
      next: (respuesta) => {
        // Actualizar el tipo en la lista
        const index = this.tipos.findIndex(t => t.id === this.editandoId);
        if (index !== -1) {
          this.tipos[index] = {
            id: this.editandoId!,
            nombre: this.nuevoTipo.nombre
          };
          this.tipos = [...this.tipos];
        }
        
        this.cdr.markForCheck();
        this.successMessage = ` "${this.nuevoTipo.nombre}" actualizado exitosamente`;
        this.resetFormulario();
        this.cancelarEdicion();
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error detallado:', error);
        let mensajeError = ' Error al actualizar el tipo';
        if (error.status === 0) {
          mensajeError = ' No se puede conectar al backend. Verifica que FastAPI esté corriendo';
        } else if (error.error?.detail) {
          mensajeError = ` ${error.error.detail}`;
        }
        this.errorMessage = mensajeError;
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  // Registrar un nuevo tipo
  registrarTipo(): void {
    // Validaciones
    if (!this.nuevoTipo.nombre || this.nuevoTipo.nombre.trim() === '') {
      this.errorMessage = ' El nombre del tipo es obligatorio';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cdr.detectChanges();

    this.tipoEventoService.crearTipo(this.nuevoTipo).subscribe({
      next: (respuesta) => {
        const nuevoTipoCompleto: TipoEvento = {
          id: respuesta.id,
          nombre: this.nuevoTipo.nombre
        };
        
        this.tipos = [nuevoTipoCompleto, ...this.tipos];
        this.cdr.markForCheck();
        
        this.successMessage = ` "${this.nuevoTipo.nombre}" registrado exitosamente`;
        this.resetFormulario();
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error detallado:', error);
        let mensajeError = ' Error al registrar el tipo';
        if (error.status === 0) {
          mensajeError = ' No se puede conectar al backend. Verifica que FastAPI esté corriendo';
        } else if (error.error?.detail) {
          mensajeError = ` ${error.error.detail}`;
        }
        this.errorMessage = mensajeError;
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  // Cancelar edición
  cancelarEdicion(): void {
    this.editandoId = null;
    this.resetFormulario();
    this.cdr.detectChanges();
  }

  // Eliminar un tipo
  eliminarTipo(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este tipo de evento?')) {
      this.loading = true;
      this.cdr.markForCheck();
      
      this.tipoEventoService.eliminarTipo(id).subscribe({
        next: () => {
          this.tipos = this.tipos.filter(tipo => tipo.id !== id);
          this.cdr.markForCheck();
          this.successMessage = ' Tipo eliminado correctamente';
          this.loading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.errorMessage = ' Error al eliminar el tipo';
          this.loading = false;
          this.cdr.markForCheck();
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  // Resetear formulario
  resetFormulario(): void {
    this.nuevoTipo = {
      nombre: ''
    };
    this.cdr.detectChanges();
  }

  // TrackBy para optimizar el renderizado de la tabla
  trackById(index: number, tipo: TipoEvento): number {
    return tipo.id || index;
  }
}