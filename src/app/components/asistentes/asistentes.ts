// components/asistentes/asistentes.component.ts
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsistenteService, Asistente } from '../../services/asistente';

@Component({
  selector: 'app-asistentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistentes.html',
  styleUrls: ['./asistentes.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsistentesComponent implements OnInit {
  // Lista de asistentes
  asistentes: Asistente[] = [];
  
  // Modelo para el formulario
  nuevoAsistente: Asistente = {
    nombre: '',
    sexo: '',
    fecha_nacimiento: '',
    email: '',
    telefono: '',
    seccion: 0
  };
  
  // Estado del componente
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Variables para edición
  editandoId: number | null = null;
  
  // Opciones para el select de sexo
  opcionesSexo = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'Otro', label: 'Otro' }
  ];

  constructor(
    private asistenteService: AsistenteService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarAsistentes();
  }

  // Cargar todos los asistentes
  cargarAsistentes(): void {
    this.loading = true;
    this.cdr.markForCheck();
    
    this.asistenteService.getAsistentes().subscribe({
      next: (data) => {
        this.asistentes = [...data];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = ' Error al cargar los asistentes';
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    });
  }

  // Validar email
  validarEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  }

  // Validar teléfono (opcional, 10 dígitos)
  validarTelefono(telefono: string): boolean {
    if (!telefono) return true;
    const regex = /^\d{10}$/;
    return regex.test(telefono);
  }

  // Preparar edición
  editarAsistente(asistente: Asistente): void {
    this.editandoId = asistente.id!;
    this.nuevoAsistente = { ...asistente };
    this.cdr.detectChanges();
    
    // Scroll al formulario
    document.querySelector('.form-card')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }

  // Actualizar asistente
  actualizarAsistente(): void {
    // Validaciones
    if (!this.nuevoAsistente.nombre || !this.nuevoAsistente.email || !this.nuevoAsistente.sexo) {
      this.errorMessage = ' Nombre, email y sexo son obligatorios';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    if (!this.validarEmail(this.nuevoAsistente.email)) {
      this.errorMessage = ' Email no válido';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    if (this.nuevoAsistente.telefono && !this.validarTelefono(this.nuevoAsistente.telefono)) {
      this.errorMessage = ' Teléfono debe tener 10 dígitos';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cdr.detectChanges();

    this.asistenteService.actualizarAsistente(this.editandoId!, this.nuevoAsistente).subscribe({
      next: () => {
        this.successMessage = ` "${this.nuevoAsistente.nombre}" actualizado exitosamente`;
        this.cargarAsistentes(); // Recargar lista
        this.resetFormulario();
        this.cancelarEdicion();
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = ` Error al actualizar: ${error.error?.detail || 'Error desconocido'}`;
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  // Registrar nuevo asistente
  registrarAsistente(): void {
    // Validaciones
    if (!this.nuevoAsistente.nombre || !this.nuevoAsistente.email || !this.nuevoAsistente.sexo) {
      this.errorMessage = ' Nombre, email y sexo son obligatorios';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    if (!this.validarEmail(this.nuevoAsistente.email)) {
      this.errorMessage = ' Email no válido';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    if (this.nuevoAsistente.telefono && !this.validarTelefono(this.nuevoAsistente.telefono)) {
      this.errorMessage = ' Teléfono debe tener 10 dígitos';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cdr.detectChanges();

    this.asistenteService.crearAsistente(this.nuevoAsistente).subscribe({
      next: () => {
        this.successMessage = ` "${this.nuevoAsistente.nombre}" registrado exitosamente`;
        this.cargarAsistentes(); // Recargar lista
        this.resetFormulario();
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = ` Error al registrar: ${error.error?.detail || 'Error desconocido'}`;
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

  // Eliminar asistente
  eliminarAsistente(id: number, nombre: string): void {
    if (confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"?`)) {
      this.loading = true;
      this.cdr.markForCheck();
      
      this.asistenteService.eliminarAsistente(id).subscribe({
        next: () => {
          this.successMessage = ' Asistente eliminado correctamente';
          this.cargarAsistentes(); // Recargar lista
          this.loading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error:', error);
          this.errorMessage = ' Error al eliminar el asistente';
          this.loading = false;
          this.cdr.markForCheck();
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  // Resetear formulario
  resetFormulario(): void {
    this.nuevoAsistente = {
      nombre: '',
      sexo: '',
      fecha_nacimiento: '',
      email: '',
      telefono: '',
      seccion: 0 
    };
    this.cdr.detectChanges();
  }

  // TrackBy para optimizar tabla
  trackById(index: number, asistente: Asistente): number {
    return asistente.id || index;
  }
}