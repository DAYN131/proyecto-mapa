// src/app/services/evento.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Evento {
    id?: number;
    nombre: string;
    fecha: string;
    hora_inicio?: string;
    tipo_id?: number;
    tipo?: string;
    lugar_id: number;
    lugar_nombre?: string;
    direccion?: string;
    lat?: number;
    lng?: number;
}

// Interfaz extendida para el mapa con coordenadas
export interface EventoMapa extends Evento {
    lat: number;
    lng: number;
    direccion: string;
}

export interface TipoEvento {
    id: number;
    nombre: string;
}

export interface Lugar {
    id: number;
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
}

@Injectable({
    providedIn: 'root'
})
export class EventoService {
    private apiUrl = 'http://localhost:8000/api';

    constructor(private http: HttpClient) { }

    // Obtener todos los eventos (con lugar incluido)
    getEventos(): Observable<Evento[]> {
        return this.http.get<Evento[]>(`${this.apiUrl}/eventos`);
    }

    // Obtener eventos CON coordenadas para el mapa
    getEventosConCoordenadas(): Observable<EventoMapa[]> {
        return this.http.get<Evento[]>(`${this.apiUrl}/eventos`).pipe(
            map(eventos => {
                // Filtrar eventos que tienen lugar_id y cargar coordenadas
                // Nota: Las coordenadas vienen del lugar, no del evento directamente
                return eventos.filter(e => e.lugar_id).map(e => ({
                    ...e,
                    lat: 0, // Temporal, se actualizará con los lugares
                    lng: 0,
                    direccion: e.direccion || ''
                } as EventoMapa));
            })
        );
    }

    // Obtener un evento específico
    getEvento(id: number): Observable<Evento> {
        return this.http.get<Evento>(`${this.apiUrl}/eventos/${id}`);
    }

    // Crear evento
    crearEvento(evento: Evento): Observable<any> {
        return this.http.post(`${this.apiUrl}/eventos`, evento);
    }

    // Actualizar evento
    actualizarEvento(id: number, evento: Evento): Observable<any> {
        return this.http.put(`${this.apiUrl}/eventos/${id}`, evento);
    }

    // Eliminar evento
    eliminarEvento(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/eventos/${id}`);
    }

    // Obtener tipos de evento
    getTiposEvento(): Observable<TipoEvento[]> {
        return this.http.get<TipoEvento[]>(`${this.apiUrl}/tipo-evento`);
    }

    // Obtener lugares (con coordenadas)
    getLugares(): Observable<Lugar[]> {
        return this.http.get<Lugar[]>(`${this.apiUrl}/lugares`);
    }
}