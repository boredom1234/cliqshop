import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';

@Injectable({
  providedIn: 'root'
})
export class DashboardChartService {
  // Minimal color palette
  private colorPalette = {
    blue: '#3b82f6',
    teal: '#14b8a6',
    pink: '#ec4899',
    purple: '#a855f7',
    amber: '#fbbf24',
    text: '#334155',
    border: '#e5e7eb'
  };

  constructor() {
    console.log('Initializing DashboardChartService and registering Chart.js components');
    
    // Register all the chart components
    Chart.register(...registerables);
    
    // Set default Chart.js options for a consistent style
    Chart.defaults.color = this.colorPalette.text;
    Chart.defaults.font.family = "'Arial', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.borderColor = this.colorPalette.border;
  }
  
  // Initialize the charts after the view is ready
  initializeCharts(): void {
    console.log('Initializing charts in service');
  }
  
  // Get default line chart options
  getLineChartOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: this.colorPalette.text
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: this.colorPalette.border
          },
          ticks: {
            color: this.colorPalette.text
          }
        },
        y: {
          grid: {
            color: this.colorPalette.border
          },
          ticks: {
            color: this.colorPalette.text
          }
        }
      }
    };
  }
  
  // Get default bar chart options
  getBarChartOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: this.colorPalette.text
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: this.colorPalette.border
          },
          ticks: {
            color: this.colorPalette.text
          }
        },
        y: {
          grid: {
            color: this.colorPalette.border
          },
          ticks: {
            color: this.colorPalette.text
          }
        }
      }
    };
  }
  
  // Get default doughnut chart options
  getDoughnutChartOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: this.colorPalette.text
          }
        }
      }
    };
  }
}
