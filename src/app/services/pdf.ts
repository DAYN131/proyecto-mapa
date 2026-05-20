// src/app/services/pdf.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DashboardStats } from './dashboard';

@Injectable({ providedIn: 'root' })
export class PdfService {

  generarReporteDashboard(stats: DashboardStats) {
    const doc = new jsPDF();
    const verde = [88, 201, 185] as [number, number, number];  // #58C9B9
    const oscuro = [26, 43, 76] as [number, number, number];   // #1A2B4C
    let y = 0;

    // ============================================
    // ENCABEZADO
    // ============================================
    doc.setFillColor(...verde);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard Cultural', 14, 22);

    const fecha = new Date().toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(fecha, 196, 22, { align: 'right' });

    y = 42;

    // ============================================
    // MÉTRICAS PRINCIPALES (4 tarjetas)
    // ============================================
    doc.setTextColor(...oscuro);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    // Icono fa-chart-line simulado con linea decorativa
    doc.setFillColor(...verde);
    doc.rect(14, y - 7, 3, 7, 'F');
    doc.text('Resumen General', 20, y);
    y += 8;

    const metricas = [
      { label: 'Eventos',    valor: stats.total_eventos,    sigla: 'EV' },
      { label: 'Asistentes', valor: stats.total_asistentes, sigla: 'AS' },
      { label: 'Lugares',    valor: stats.total_lugares,    sigla: 'LG' },
      { label: 'Registros',  valor: stats.total_registros,  sigla: 'RG' }
    ];

    let x = 14;
    metricas.forEach((m) => {
      // Tarjeta
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(x, y, 43, 24, 3, 3, 'F');

      // Badge de icono (circulo con sigla)
      doc.setFillColor(...verde);
      doc.circle(x + 6, y + 7, 4, 'F');
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(m.sigla, x + 3.8, y + 8.5);

      // Etiqueta
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(m.label.toUpperCase(), x + 13, y + 8);

      // Valor
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...oscuro);
      doc.text(String(m.valor), x + 4, y + 19);

      x += 46;
    });

    y += 34;

    // ============================================
    // EVENTOS POR TIPO (gráfica de barras)
    // ============================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...oscuro);

    // Barra lateral decorativa (fa-palette)
    doc.setFillColor(...verde);
    doc.rect(14, y - 7, 3, 7, 'F');
    doc.text('Eventos por Tipo', 20, y);
    y += 8;

    const tipos = stats.eventos_por_tipo;
    const maxEventos = Math.max(...tipos.map(t => t.total), 1);
    let barX = 14;
    
    tipos.forEach((tipo) => {
      const barWidth = (tipo.total / maxEventos) * 100;

      // Fondo barra
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(barX, y, 100, 6, 1, 1, 'F');

      // Barra de valor
      doc.setFillColor(...verde);
      doc.roundedRect(barX, y, barWidth, 6, 1, 1, 'F');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`${tipo.tipo} (${tipo.total})`, barX, y + 12);

      barX += 55;
      if (barX > 170) {
        barX = 14;
        y += 18;
      }
    });

    y += 22;

    // ============================================
    // TOP EVENTOS
    // ============================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...oscuro);

    // Barra lateral decorativa (fa-trophy)
    doc.setFillColor(...verde);
    doc.rect(14, y - 7, 3, 7, 'F');
    doc.text('Top 5 Eventos con Mas Asistentes', 20, y);
    y += 8;

    // Cabecera tabla
    doc.setFillColor(...verde);
    doc.roundedRect(14, y, 182, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 18, y + 5);
    doc.text('Evento', 28, y + 5);
    doc.text('Asistentes', 150, y + 5);
    y += 8;

    // Filas
    stats.top_eventos.forEach((evento, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(245, 249, 248);
        doc.rect(14, y, 182, 6, 'F');
      }

      // Numero con circulo
      doc.setFillColor(...oscuro);
      doc.circle(19, y + 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(String(idx + 1), idx < 9 ? 18 : 17, y + 4.5);

      doc.setTextColor(...oscuro);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(
        evento.nombre.length > 35 ? evento.nombre.substring(0, 32) + '...' : evento.nombre,
        28, y + 4
      );
      doc.text(String(evento.asistentes), 150, y + 4);
      y += 7;
    });

    y += 8;

    // ============================================
    // TOP LUGARES
    // ============================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...oscuro);

    // Barra lateral decorativa (fa-map-marker)
    doc.setFillColor(...verde);
    doc.rect(14, y - 7, 3, 7, 'F');
    doc.text('Top 5 Lugares con Mas Eventos', 20, y);
    y += 8;

    // Cabecera tabla
    doc.setFillColor(...verde);
    doc.roundedRect(14, y, 182, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 18, y + 5);
    doc.text('Lugar', 28, y + 5);
    doc.text('Eventos', 150, y + 5);
    y += 8;

    // Filas
    stats.top_lugares.forEach((lugar, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(245, 249, 248);
        doc.rect(14, y, 182, 6, 'F');
      }

      // Numero con circulo
      doc.setFillColor(...oscuro);
      doc.circle(19, y + 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(String(idx + 1), idx < 9 ? 18 : 17, y + 4.5);

      doc.setTextColor(...oscuro);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(
        lugar.nombre.length > 35 ? lugar.nombre.substring(0, 32) + '...' : lugar.nombre,
        28, y + 4
      );
      doc.text(String(lugar.eventos), 150, y + 4);
      y += 7;
    });

    y += 12;

    // ============================================
    // SECCIÓN DESTACADA
    // ============================================
    if (stats.seccion_top) {
      doc.setFillColor(...verde);
      doc.roundedRect(14, y, 182, 22, 3, 3, 'F');

      // Estrella decorativa con circulo blanco (fa-star)
      doc.setFillColor(255, 255, 255);
      doc.circle(24, y + 11, 6, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...verde);
      doc.text('*', 21.5, y + 14);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Seccion con Mayor Participacion Cultural', 34, y + 8);
      doc.setFontSize(11);
      doc.text(`Seccion ${stats.seccion_top.seccion}`, 34, y + 15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${stats.seccion_top.asistentes} asistentes unicos`, 34, y + 20);
    }

    y += 32;

    // ============================================
    // TASA DE PARTICIPACIÓN
    // ============================================
    doc.setTextColor(...oscuro);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    // Barra lateral decorativa (fa-chart-bar)
    doc.setFillColor(...verde);
    doc.rect(14, y - 7, 3, 7, 'F');
    doc.text('Tasa de Participacion', 20, y);
    y += 8;

    // Fondo de la barra de progreso
    const progWidth = 120;
    const progX = 14;
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(progX, y, progWidth, 8, 2, 2, 'F');

    // Barra de progreso real
    const pct = Math.min(stats.tasa_participacion, 100);
    doc.setFillColor(...verde);
    doc.roundedRect(progX, y, (pct / 100) * progWidth, 8, 2, 2, 'F');

    // Porcentaje grande a la derecha
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...verde);
    doc.text(`${stats.tasa_participacion}%`, 142, y + 8);

    y += 14;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `de ${stats.total_asistentes} asistentes han participado en eventos`,
      progX, y
    );

    // ============================================
    // PIE DE PÁGINA
    // ============================================
    doc.setFillColor(...verde);
    doc.rect(0, 278, 210, 1, 'F');           // línea superior del footer
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 279, 210, 18, 'F');

    // Punto decorativo izquierdo
    doc.setFillColor(...verde);
    doc.circle(14, 286, 2, 'F');

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Reporte generado desde el Dashboard Cultural', 105, 286, { align: 'center' });

    // Guardar PDF
    doc.save(`dashboard-cultural-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}