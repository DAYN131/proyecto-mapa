import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoEvento {
    id: number;
    nombre: string;
}

@Injectable({
    providedIn: 'root'
})
export class TipoEventoService {
    private apiUrl = '/api/tipo-evento';

    constructor(private http: HttpClient) { }

    getTipos(): Observable<TipoEvento[]> {
        return this.http.get<TipoEvento[]>(this.apiUrl);
    }
}