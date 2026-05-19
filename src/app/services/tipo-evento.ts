import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoEvento {
    id?: number;
    nombre: string;
}

@Injectable({
    providedIn: 'root'
})
export class TipoEventoService {
    private apiUrl = 'http://localhost:8000/api/tipo-evento';

    constructor(private http: HttpClient) { }

    getTipos(): Observable<TipoEvento[]> {
        return this.http.get<TipoEvento[]>(this.apiUrl);
    }

    crearTipo(tipo: TipoEvento): Observable<any> {
        return this.http.post(this.apiUrl, tipo);
    }

    actualizarTipo(id: number, tipo: TipoEvento): Observable<TipoEvento> {
        return this.http.put<TipoEvento>(`${this.apiUrl}/${id}`, tipo);
    }

    eliminarTipo(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}