// components/lugares/lugares.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LugarService, Lugar } from '../../services/lugar';

@Component({
  selector: 'app-lugares',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lugares.html',
  styleUrls: ['./lugares.css']
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

  constructor(private lugarService: LugarService) { }

  ngOnInit(): void {
    this.cargarLugares();
  }

  // Cargar todos los lugares desde el backend
  cargarLugares(): void {
    this.loading = true;
    this.lugarService.getLugares().subscribe({
      next: (data) => {
        this.lugares = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar lugares:', error);
        this.errorMessage = 'Error al cargar los lugares. Por favor, intenta nuevamente.';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 3000);
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

  // Registrar un nuevo lugar
  registrarLugar(): void {
    // Validar campos
    if (!this.nuevoLugar.nombre || !this.nuevoLugar.direccion || !this.gmapsLinkInput) {
      this.errorMessage = ' Todos los campos son obligatorios';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    // Extraer coordenadas del enlace
    const coords = this.extraerCoordenadas(this.gmapsLinkInput);
    if (!coords) {
      this.errorMessage = ' No se pudieron extraer las coordenadas del enlace. Asegúrate de que contenga ?q=lat,lng o @lat,lng';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }
    
    // Validar coordenadas
    if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
      this.errorMessage = ' Coordenadas inválidas';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    // Preparar objeto para enviar al backend
    const lugarParaEnviar: Lugar = {
      nombre: this.nuevoLugar.nombre,
      direccion: this.nuevoLugar.direccion,
      lat: coords.lat,
      lng: coords.lng,
      gmapslink: this.gmapsLinkInput
    };
    
    this.loading = true;
    this.lugarService.crearLugar(lugarParaEnviar).subscribe({
      next: (nuevoLugar) => {
        this.successMessage = ' Lugar registrado exitosamente';
        this.cargarLugares(); // Recargar la lista
        this.resetFormulario();
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error al registrar lugar:', error);
        this.errorMessage = ' Error al registrar el lugar. Por favor, intenta nuevamente.';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // Eliminar un lugar
  eliminarLugar(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este lugar?')) {
      this.loading = true;
      this.lugarService.eliminarLugar(id).subscribe({
        next: () => {
          this.successMessage = ' Lugar eliminado correctamente';
          this.cargarLugares(); // Recargar la lista
          this.loading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error al eliminar lugar:', error);
          this.errorMessage = ' Error al eliminar el lugar';
          this.loading = false;
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
  }

  // Cargar lugares de ejemplo (opcional)
  cargarEjemplos(): void {
    const ejemplos = [
      {
        nombre: "Teatro Mayor",
        direccion: "Calle 45 # 20-30, Bogotá",
        gmapsLink: "https://www.google.com/maps?q=4.6672,-74.1079"
      },
      {
        nombre: "Centro Citibanamex",
        direccion: "Av. del Conscripto 311, CDMX",
        gmapsLink: "https://www.google.com/maps?q=19.4647,-99.2394"
      },
      {
        nombre: "Feria de Madrid",
        direccion: "Madrid, España",
        gmapsLink: "https://www.google.com/maps?q=40.4675,-3.6276"
      }
    ];
    
    ejemplos.forEach(ejemplo => {
      this.nuevoLugar.nombre = ejemplo.nombre;
      this.nuevoLugar.direccion = ejemplo.direccion;
      this.gmapsLinkInput = ejemplo.gmapsLink;
      this.registrarLugar();
    });
  }
}