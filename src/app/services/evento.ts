// src/app/services/evento.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

export interface TipoEvento {
    id: number;
    nombre: string;
}

export interface Lugar {
    id: number;
    nombre: string;
    direccion: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventoService {
    private apiUrl = 'http://localhost:8000/api';

    constructor(private http: HttpClient) { }

    // Obtener todos los eventos (ahora es /api/eventos, no /eventos-con-lugar)
    getEventos(): Observable<Evento[]> {
        return this.http.get<Evento[]>(`${this.apiUrl}/eventos`);
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

    // Obtener lugares
    getLugares(): Observable<Lugar[]> {
        return this.http.get<Lugar[]>(`${this.apiUrl}/lugares`);
    }
}