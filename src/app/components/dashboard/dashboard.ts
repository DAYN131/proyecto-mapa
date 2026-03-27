import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { PdfService } from '../../services/pdf';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements AfterViewInit {

  metricas = [
    { label: 'Total eventos',  valor: 142,    tag: '+12 este mes',        tipo: 'up'      },
    { label: 'Asistentes',     valor: '8,430', tag: '+5.2% vs anterior',  tipo: 'up'      },
    { label: 'Ubicaciones',    valor: 24,     tag: 'en 6 municipios',     tipo: 'neutral' },
    { label: 'Cancelados',     valor: 3,      tag: '-2 vs anterior',      tipo: 'down'    },
  ];

  eventos = [
    { nombre: 'Festival de verano',   lugar: 'Parque central',   tipo: 'concierto', asistentes: 1200 },
    { nombre: 'Feria artesanal',       lugar: 'Plaza mayor',     tipo: 'feria',      asistentes: 850  },
    { nombre: 'Exposición fotografía', lugar: 'Museo regional',  tipo: 'cultural',   asistentes: 430  },
    { nombre: 'Torneo de fútbol',      lugar: 'Estadio mpal.',   tipo: 'deportivo',  asistentes: 2100 },
    { nombre: 'Noche de jazz',         lugar: 'Teatro del lago', tipo: 'concierto',  asistentes: 560  },
  ];

  constructor(private pdfService: PdfService) {}

  exportarPDF() {
    this.pdfService.generarReporte(this.metricas, this.eventos);
  }

  ngAfterViewInit() {
    new Chart('chartMes', {
      type: 'bar',
      data: {
        labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
        datasets: [
          { label: 'Realizados', data: [8,12,10,15,18,22,20,17,14,16,11,9], backgroundColor: '#1D9E75', borderRadius: 4 },
          { label: 'Planeados',  data: [2,3,4,2,3,1,3,4,5,3,6,8],          backgroundColor: '#B5D4F4', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f0f0' } }
        }
      }
    });

    new Chart('chartTipo', {
      type: 'doughnut',
      data: {
        labels: ['Concierto','Feria','Cultural','Deportivo'],
        datasets: [{ data: [38,27,21,14], backgroundColor: ['#1D9E75','#378ADD','#7F77DD','#EF9F27'], borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '68%'
      }
    });
  }
}