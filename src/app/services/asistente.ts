// services/asistente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// services/asistente.service.ts
export interface Asistente {
    id?: number;
    nombre: string;
    sexo: string;          
    fecha_nacimiento?: string;  
    email: string;
    telefono?: string;
    seccion?: number;      
}

@Injectable({
    providedIn: 'root'
})
export class AsistenteService {
    private apiUrl = 'http://localhost:8000/api/asistentes';

    constructor(private http: HttpClient) { }

    // Obtener todos los asistentes
    getAsistentes(): Observable<Asistente[]> {
        return this.http.get<Asistente[]>(this.apiUrl);
    }

    // Obtener un asistente por ID
    getAsistente(id: number): Observable<Asistente> {
        return this.http.get<Asistente>(`${this.apiUrl}/${id}`);
    }

    // Crear nuevo asistente
    crearAsistente(asistente: Asistente): Observable<any> {
        return this.http.post(this.apiUrl, asistente);
    }

    // Actualizar asistente existente
    actualizarAsistente(id: number, asistente: Asistente): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, asistente);
    }

    // Eliminar asistente
    eliminarAsistente(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}