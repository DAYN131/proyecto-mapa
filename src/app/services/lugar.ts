// services/lugar.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Lugar {
    id?: number;
    nombre: string;
    direccion: string;     
    lat: number;            
    lng: number;            
    gmapslink: string;      
}

@Injectable({
    providedIn: 'root'
})
export class LugarService {
    private apiUrl = 'http://localhost:8000/api/lugares';

    constructor(private http: HttpClient) { }

    getLugares(): Observable<Lugar[]> {
        console.log('GET Lugares desde:', this.apiUrl);
        return this.http.get<Lugar[]>(this.apiUrl);
    }

    getLugar(id: number): Observable<Lugar> {
        return this.http.get<Lugar>(`${this.apiUrl}/${id}`);
    }

    crearLugar(lugar: Lugar): Observable<any> {
        console.log('POST a:', this.apiUrl, lugar);
        return this.http.post(this.apiUrl, lugar);
    }

    actualizarLugar(id: number, lugar: Lugar): Observable<Lugar> {
        const url = `${this.apiUrl}/${id}`;
        console.log('PUT a:', url, lugar);
        return this.http.put<Lugar>(url, lugar);
    }

    eliminarLugar(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}