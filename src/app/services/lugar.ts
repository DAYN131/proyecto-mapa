import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Lugar {
    id?: number;
    nombre: string;
    colonia?: string;
    latitud?: number;
    longitud?: number;
}

@Injectable({
    providedIn: 'root'
})
export class LugarService {
    private apiUrl = '/api/lugares';

    constructor(private http: HttpClient) { }

    getLugares(): Observable<Lugar[]> {
        return this.http.get<Lugar[]>(this.apiUrl);
    }

    crearLugar(lugar: Lugar): Observable<any> {
        return this.http.post(this.apiUrl, lugar);
    }
}