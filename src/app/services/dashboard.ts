// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  total_eventos: number;
  total_asistentes: number;
  total_lugares: number;
  total_registros: number;
  eventos_por_tipo: Array<{ tipo: string; total: number }>;
  top_eventos: Array<{ nombre: string; asistentes: number }>;
  top_lugares: Array<{ nombre: string; eventos: number }>;
  seccion_top: { seccion: string; asistentes: number } | null;
  asistentes_por_mes: Array<{ mes: string; asistentes: number }>;
  tasa_participacion: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }
}