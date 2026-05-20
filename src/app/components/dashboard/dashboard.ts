// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, DashboardStats } from '../../services/dashboard';
import { PdfService } from '../../services/pdf';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading: boolean = true;
  errorMessage: string = '';

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
     private pdfService: PdfService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarStats();
  }

  exportarPDF() {
    if (this.stats) {
      this.pdfService.generarReporteDashboard(this.stats);
    }
  }

  cargarStats() {
    this.loading = true;
    this.cdr.detectChanges();

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
        console.log(' Dashboard stats cargados:', data);
      },
      error: (error) => {
        console.error(' Error:', error);
        this.errorMessage = 'Error al cargar estadísticas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irAEventos() {
    this.router.navigate(['/eventos']);
  }

  irALugares() {
    this.router.navigate(['/lugares']);
  }

  irAAsistentes() {
    this.router.navigate(['/asistentes']);
  }

  irAMapa() {
    this.router.navigate(['/mapa-eventos']);
  }

  getMaxAsistentesMes(): number {
    if (!this.stats || !this.stats.asistentes_por_mes.length) return 0;
    return Math.max(...this.stats.asistentes_por_mes.map(m => m.asistentes));
  }

  getPorcentaje(parte: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((parte / total) * 100)}%`;
  }
}