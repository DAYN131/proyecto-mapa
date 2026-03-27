import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({ providedIn: 'root' })
export class PdfService {

  generarReporte(metricas: any[], eventos: any[]) {
    const doc = new jsPDF();
    const verde = [29, 158, 117] as [number, number, number];
    const oscuro = [26, 26, 46] as [number, number, number];

    // Encabezado
    doc.setFillColor(...verde);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Eventos', 14, 18);

    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(fecha, 196, 18, { align: 'right' });

    // Métricas
    doc.setTextColor(...oscuro);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen general', 14, 42);

    let x = 14;
    metricas.forEach((m) => {
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(x, 48, 43, 22, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(136, 136, 136);
      doc.text(m.label.toUpperCase(), x + 4, 55);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...oscuro);
      doc.text(String(m.valor), x + 4, 64);
      x += 47;
    });

    // Tabla eventos
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...oscuro);
    doc.text('Últimos eventos', 14, 84);

    // Cabecera tabla
    doc.setFillColor(...verde);
    doc.rect(14, 88, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Nombre',      18, 93.5);
    doc.text('Lugar',       90, 93.5);
    doc.text('Tipo',       135, 93.5);
    doc.text('Asistentes', 168, 93.5);

    // Filas
    let y = 100;
    eventos.forEach((e, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(14, y - 1, 182, 9, 'F');
      }
      doc.setTextColor(...oscuro);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(e.nombre,           18, y + 5);
      doc.text(e.lugar,            90, y + 5);
      doc.text(e.tipo,            135, y + 5);
      doc.text(String(e.asistentes), 168, y + 5);
      y += 10;
    });

    doc.save('reporte-eventos.pdf');
  }
}