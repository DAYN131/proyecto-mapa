// src/app/services/evento-asistente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistroEvento {
    id?: number;
    evento_id?: number;
    evento?: string;
    asistente_id?: number;
    asistente?: string;
    asistente_email?: string;
    asistente_telefono?: string;
    asistente_seccion?: string;
    fecha_registro?: string;
    fecha_evento?: string;
    hora_evento?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventoAsistenteService {
    private apiUrl = 'http://localhost:8000/api/evento-asistente';

    constructor(private http: HttpClient) { }

    getRegistros(): Observable<RegistroEvento[]> {
        return this.http.get<RegistroEvento[]>(this.apiUrl);
    }

    registrarAsistente(data: { evento_id: number; asistente_id: number }): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    eliminarRegistro(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}