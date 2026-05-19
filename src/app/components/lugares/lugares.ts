// components/lugares/lugares.ts
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LugarService, Lugar } from '../../services/lugar';

@Component({
  selector: 'app-lugares',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lugares.html',
  styleUrls: ['./lugares.css'],
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class LugaresComponent implements OnInit {
  // Lista de lugares
  lugares: Lugar[] = [];
  
  // Modelo para el formulario
  nuevoLugar: Lugar = {
    nombre: '',
    direccion: '',
    lat: 0,
    lng: 0,
    gmapslink: ''
  };
  
  // Estado del componente
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Variable para el enlace de Google Maps temporal
  gmapsLinkInput = '';
  
  // Variable para identificar si estamos editando
  editandoId: number | null = null;

  constructor(
    private lugarService: LugarService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarLugares();
  }

  // Cargar todos los lugares desde el backend
  cargarLugares(): void {
    this.loading = true;
    this.cdr.markForCheck();  
    
    this.lugarService.getLugares().subscribe({
      next: (data) => {
        this.lugares = [...data];  
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = ' Error al cargar los lugares';
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    });
  }

  // Extraer coordenadas del enlace de Google Maps
  extraerCoordenadas(url: string): { lat: number; lng: number } | null {
    if (!url) return null;
    
    // Patrón para ?q=lat,lng
    let match = url.match(/[?&]q=([-\d.]+),([-\d.]+)/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    
    // Patrón para @lat,lng
    match = url.match(/@([-\d.]+),([-\d.]+)/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    
    // Patrón para ll=lat,lng
    match = url.match(/[?&]ll=([-\d.]+),([-\d.]+)/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    
    return null;
  }

  // Preparar formulario para editar un lugar
  editarLugar(lugar: Lugar): void {
    this.editandoId = lugar.id!;
    this.nuevoLugar = {
      nombre: lugar.nombre,
      direccion: lugar.direccion,
      lat: lugar.lat,
      lng: lugar.lng,
      gmapslink: lugar.gmapslink
    };
    this.gmapsLinkInput = lugar.gmapslink || '';
    this.cdr.detectChanges();
    
    // Scroll suave al formulario
    document.querySelector('.form-card')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }


actualizarLugar(): void {
  // Validaciones
  if (!this.nuevoLugar.nombre || !this.nuevoLugar.direccion || !this.gmapsLinkInput) {
    this.errorMessage = ' Todos los campos son obligatorios';
    setTimeout(() => this.errorMessage = '', 3000);
    return;
  }
  
  const coords = this.extraerCoordenadas(this.gmapsLinkInput);
  if (!coords) {
    this.errorMessage = ' No se pudieron extraer las coordenadas del enlace';
    setTimeout(() => this.errorMessage = '', 4000);
    return;
  }
  
  const lugarParaActualizar = {
    nombre: this.nuevoLugar.nombre,
    direccion: this.nuevoLugar.direccion,
    lat: coords.lat,
    lng: coords.lng,
    gmapslink: this.gmapsLinkInput
  };
  
  this.loading = true;
  this.cdr.detectChanges();

  this.lugarService.actualizarLugar(this.editandoId!, lugarParaActualizar).subscribe({
    next: (respuesta) => {
      // Actualizar el lugar en la lista local
      const index = this.lugares.findIndex(l => l.id === this.editandoId);
      if (index !== -1) {
        this.lugares[index] = {
          id: this.editandoId!,
          nombre: lugarParaActualizar.nombre,
          direccion: lugarParaActualizar.direccion,
          lat: lugarParaActualizar.lat,
          lng: lugarParaActualizar.lng,
          gmapslink: lugarParaActualizar.gmapslink
        };
        // Forzar actualización de la vista (importante para OnPush)
        this.lugares = [...this.lugares];
      }
      
      this.successMessage = ` "${this.nuevoLugar.nombre}" actualizado exitosamente`;
      this.resetFormulario();
      this.cancelarEdicion();
      this.loading = false;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      }, 3000);
    },
    error: (error) => {
      console.error(' Error:', error);
      let mensajeError = ' Error al actualizar el lugar';
      if (error.status === 0) {
        mensajeError = ' No se puede conectar al backend. Verifica que FastAPI esté corriendo';
      } else if (error.error?.detail) {
        mensajeError = ` ${error.error.detail}`;
      }
      this.errorMessage = mensajeError;
      this.loading = false;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.detectChanges();
      }, 4000);
    }
  });
}

  // Registrar un nuevo lugar
  registrarLugar(): void {
    // Validaciones
    if (!this.nuevoLugar.nombre || !this.nuevoLugar.direccion || !this.gmapsLinkInput) {
      this.errorMessage = ' Todos los campos son obligatorios';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    const coords = this.extraerCoordenadas(this.gmapsLinkInput);
    if (!coords) {
      this.errorMessage = ' No se pudieron extraer las coordenadas del enlace';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }
    
    // Preparar datos para enviar
    const lugarParaEnviar = {
      nombre: this.nuevoLugar.nombre,
      direccion: this.nuevoLugar.direccion,
      lat: coords.lat,
      lng: coords.lng,
      gmapslink: this.gmapsLinkInput
    };
    
    this.loading = true;
    this.cdr.detectChanges();

    this.lugarService.crearLugar(lugarParaEnviar).subscribe({
      next: (respuesta) => {
        const nuevoLugarCompleto: Lugar = {
          id: respuesta.id,
          nombre: lugarParaEnviar.nombre,
          direccion: lugarParaEnviar.direccion,
          lat: lugarParaEnviar.lat,
          lng: lugarParaEnviar.lng,
          gmapslink: lugarParaEnviar.gmapslink
        };
        
        this.lugares = [nuevoLugarCompleto, ...this.lugares];
        this.cdr.markForCheck();
        
        this.successMessage = ` "${this.nuevoLugar.nombre}" registrado exitosamente`;
        this.resetFormulario();
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error detallado:', error);
        let mensajeError = ' Error al registrar el lugar';
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

  // Eliminar un lugar
  eliminarLugar(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este lugar?')) {
      this.loading = true;
      this.cdr.markForCheck();
      
      this.lugarService.eliminarLugar(id).subscribe({
        next: () => {
          this.lugares = this.lugares.filter(lugar => lugar.id !== id);
          this.cdr.markForCheck();
          this.successMessage = ' Lugar eliminado correctamente';
          this.loading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.errorMessage = ' Error al eliminar el lugar';
          this.loading = false;
          this.cdr.markForCheck();
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  // Resetear formulario
  resetFormulario(): void {
    this.nuevoLugar = {
      nombre: '',
      direccion: '',
      lat: 0,
      lng: 0,
      gmapslink: ''
    };
    this.gmapsLinkInput = '';
    this.cdr.detectChanges();
  }

  // TrackBy para optimizar el renderizado de la tabla
  trackById(index: number, lugar: Lugar): number {
    return lugar.id || index;
  }
}