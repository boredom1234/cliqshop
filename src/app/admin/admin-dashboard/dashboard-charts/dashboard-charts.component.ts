import { Component, Input, OnChanges, SimpleChanges, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { DashboardChartService } from '../../services/dashboard-chart.service';

// Register Chart.js components
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController
);

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-charts.component.html',
  styleUrl: './dashboard-charts.component.scss'
})
export class DashboardChartsComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() revenueByDay: Record<string, number> = {};
  @Input() ordersByDay: Record<string, number> = {};
  @Input() revenueByMonth: Record<string, number> = {};
  @Input() ordersByMonth: Record<string, number> = {};
  @Input() topSellingProducts: Array<{
    id: number;
    name: string;
    imageUrl: string;
    totalQuantity: number;
    totalRevenue: number;
  }> = [];
  
  @Input() pendingOrders = 0;
  @Input() confirmedOrders = 0;
  @Input() shippedOrders = 0;
  @Input() deliveredOrders = 0;
  @Input() cancelledOrders = 0;

  @ViewChild('revenueCanvas') revenueCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersCanvas') ordersCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('productsCanvas') productsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvas?: ElementRef<HTMLCanvasElement>;

  // Revenue Chart
  public revenueChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Daily Revenue',
        fill: true,
        tension: 0.1,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#3b82f6',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6'
      }
    ]
  };
  
  public revenueChartOptions: ChartConfiguration['options'];
  
  // Orders Chart
  public ordersChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Daily Orders',
        backgroundColor: 'rgba(14, 165, 142, 0.7)',
        hoverBackgroundColor: 'rgba(14, 165, 142, 1)'
      }
    ]
  };
  
  public ordersChartOptions: ChartConfiguration['options'];
  
  // Top Products Chart
  public productsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Revenue',
        backgroundColor: 'rgba(236, 72, 153, 0.7)',
        hoverBackgroundColor: 'rgba(236, 72, 153, 1)'
      },
      {
        data: [],
        label: 'Quantity',
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        hoverBackgroundColor: 'rgba(168, 85, 247, 1)'
      }
    ]
  };
  
  public productsChartOptions: ChartConfiguration['options'];
  
  // Order Status Chart
  public statusChartData: ChartData<'doughnut'> = {
    labels: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(251, 191, 36, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(14, 165, 142, 0.7)',
          'rgba(236, 72, 153, 0.7)'
        ],
        hoverBackgroundColor: [
          'rgba(251, 191, 36, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(14, 165, 142, 1)',
          'rgba(236, 72, 153, 1)'
        ]
      }
    ]
  };
  
  public statusChartOptions: ChartConfiguration['options'];

  // Chart instances
  private revenueChart?: Chart;
  private ordersChart?: Chart;
  private productsChart?: Chart;
  private statusChart?: Chart;

  constructor(private chartService: DashboardChartService) {
    console.log('DashboardChartsComponent created');
    
    // Get default chart options from service
    this.revenueChartOptions = this.chartService.getLineChartOptions();
    
    // Special configuration for orders chart - enforce integer steps
    this.ordersChartOptions = {
      ...this.chartService.getBarChartOptions(),
      scales: {
        x: {
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            color: '#334155'
          }
        },
        'y': {
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            color: '#334155',
            stepSize: 1,
            precision: 0
          },
          beginAtZero: true
        }
      }
    };
    
    // Set horizontal bar for products chart
    this.productsChartOptions = {
      ...this.chartService.getBarChartOptions(),
      indexAxis: 'y'
    };
    
    this.statusChartOptions = this.chartService.getDoughnutChartOptions();
  }

  ngOnInit(): void {
    console.log('Chart component initialized');
    
    // Initialize charts with available data
    this.updateTimeSeriesCharts();
    this.updateProductsChart();
    this.updateStatusChart();
  }
  
  ngAfterViewInit(): void {
    console.log('Chart component view initialized');
    this.createCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Chart data changed', changes);
    
    if (changes['revenueByDay'] || changes['ordersByDay']) {
      this.updateTimeSeriesCharts();
      
      // Update chart instances if they exist
      if (this.revenueChart) {
        this.revenueChart.update();
      }
      
      if (this.ordersChart) {
        this.ordersChart.update();
      }
    }
    
    if (changes['topSellingProducts']) {
      this.updateProductsChart();
      
      if (this.productsChart) {
        this.productsChart.update();
      }
    }
    
    if (changes['pendingOrders'] || changes['confirmedOrders'] || 
        changes['shippedOrders'] || changes['deliveredOrders'] || 
        changes['cancelledOrders']) {
      this.updateStatusChart();
      
      if (this.statusChart) {
        this.statusChart.update();
      }
    }
  }
  
  private createCharts(): void {
    console.log('Creating chart instances');
    
    // Create Revenue Chart
    if (this.revenueCanvas) {
      this.revenueChart = new Chart(this.revenueCanvas.nativeElement, {
        type: 'line',
        data: this.revenueChartData,
        options: this.revenueChartOptions
      });
    }
    
    // Create Orders Chart
    if (this.ordersCanvas) {
      // Ensure we have at least a default max value set
      if (this.ordersChartOptions && this.ordersChartOptions.scales && this.ordersChartOptions.scales['y']) {
        if (!this.ordersChartOptions.scales['y'].max) {
          this.ordersChartOptions.scales['y'].max = 5; // Default max value
        }
      }
      
      this.ordersChart = new Chart(this.ordersCanvas.nativeElement, {
        type: 'bar',
        data: this.ordersChartData,
        options: this.ordersChartOptions
      });
      
      console.log('Orders chart created with options:', this.ordersChartOptions);
    }
    
    // Create Products Chart
    if (this.productsCanvas) {
      this.productsChart = new Chart(this.productsCanvas.nativeElement, {
        type: 'bar',
        data: this.productsChartData,
        options: this.productsChartOptions
      });
    }
    
    // Create Status Chart
    if (this.statusCanvas) {
      this.statusChart = new Chart(this.statusCanvas.nativeElement, {
        type: 'doughnut',
        data: this.statusChartData,
        options: this.statusChartOptions
      });
    }
  }
  
  private updateTimeSeriesCharts(): void {
    console.log('Updating time series charts');
    
    // Revenue chart - only update if we have data
    if (Object.keys(this.revenueByDay).length > 0) {
      // Sort dates for revenue chart
      const sortedRevenueDates = Object.keys(this.revenueByDay).sort();
      const revenueValues = sortedRevenueDates.map(date => this.revenueByDay[date]);
      
      this.revenueChartData.labels = sortedRevenueDates;
      this.revenueChartData.datasets[0].data = revenueValues;
    } else {
      // Empty data for revenue chart
      this.revenueChartData.labels = [];
      this.revenueChartData.datasets[0].data = [];
    }
    
    // Orders chart - only update if we have data
    if (Object.keys(this.ordersByDay).length > 0) {
      // Sort dates for orders chart
      const sortedOrderDates = Object.keys(this.ordersByDay).sort();
      const orderValues = sortedOrderDates.map(date => this.ordersByDay[date]);
      
      this.ordersChartData.labels = sortedOrderDates;
      this.ordersChartData.datasets[0].data = orderValues;
      
      // Calculate the max value for the y-axis with some padding
      if (orderValues.length > 0) {
        const maxOrderValue = Math.max(...orderValues);
        // Set chart options with the appropriate max value, ensuring it's at least 5
        // and rounded up to the next appropriate integer
        const suggestedMax = Math.max(5, Math.ceil(maxOrderValue * 1.2));
        
        if (this.ordersChartOptions && this.ordersChartOptions.scales) {
          if (this.ordersChartOptions.scales['y']) {
            this.ordersChartOptions.scales['y'].max = suggestedMax;
          }
        }
        
        // If we have the chart instance, update it
        if (this.ordersChart) {
          this.ordersChart.update();
        }
      }
    } else {
      // Empty data for orders chart
      this.ordersChartData.labels = [];
      this.ordersChartData.datasets[0].data = [];
      
      // Reset max to default when no data
      if (this.ordersChartOptions && this.ordersChartOptions.scales) {
        if (this.ordersChartOptions.scales['y']) {
          this.ordersChartOptions.scales['y'].max = 5; // Default max value when no data
        }
      }
    }
    
    console.log('Revenue chart data:', this.revenueChartData);
    console.log('Orders chart data:', this.ordersChartData);
  }
  
  private updateProductsChart(): void {
    console.log('Updating products chart');
    
    if (this.topSellingProducts && this.topSellingProducts.length > 0) {
      // Limit to top 5 products
      const topProducts = this.topSellingProducts.slice(0, 5);
      
      this.productsChartData.labels = topProducts.map(p => p.name);
      this.productsChartData.datasets[0].data = topProducts.map(p => p.totalRevenue);
      this.productsChartData.datasets[1].data = topProducts.map(p => p.totalQuantity);
    } else {
      // Empty data for products chart
      this.productsChartData.labels = [];
      this.productsChartData.datasets[0].data = [];
      this.productsChartData.datasets[1].data = [];
    }
    
    console.log('Products chart data:', this.productsChartData);
  }
  
  private updateStatusChart(): void {
    console.log('Updating status chart');
    
    // Check if we have any orders before updating the chart
    const totalOrders = this.pendingOrders + this.confirmedOrders + 
                        this.shippedOrders + this.deliveredOrders + 
                        this.cancelledOrders;
                        
    if (totalOrders > 0) {
      this.statusChartData.datasets[0].data = [
        this.pendingOrders,
        this.confirmedOrders,
        this.shippedOrders, 
        this.deliveredOrders,
        this.cancelledOrders
      ];
    } else {
      // Empty data for status chart
      this.statusChartData.datasets[0].data = [0, 0, 0, 0, 0];
    }
    
    console.log('Status chart data:', this.statusChartData);
  }
}
