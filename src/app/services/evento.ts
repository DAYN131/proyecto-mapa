import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Evento {
    id?: number;
    nombre: string;
    fecha: string;
    tipo_id?: number;
    tipo?: string;  
    lugar?: string;
    lat?: number;
    lng?: number;
    descripcion?: string;
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventoService {
    private apiUrl = '/api/eventos';
    constructor(private http: HttpClient) { }

    // Obtener todos los eventos (con JOIN a tipo_evento)
    getEventos(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    // Crear un nuevo evento
    crearEvento(evento: any): Observable<any> {
        // Transformamos los datos para la BD
        const eventoParaBD = {
        nombre: evento.nombre,
        fecha: evento.fecha,
        tipo_id: evento.tipo_id
        };
        return this.http.post(this.apiUrl, eventoParaBD);
    }
}