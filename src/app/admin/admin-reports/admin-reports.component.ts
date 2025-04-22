import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';

// Ensure FontAwesome styles are available - the admin layout likely already imports this
// If not, you may need to add the FontAwesome CSS in your main styles.scss or index.html

interface ReportResponse {
  success: boolean;
  message: string;
  data: any;
}

type ReportType = 'dashboard' | 'inventory' | 'customers' | 'sales';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss']
})
export class AdminReportsComponent implements OnInit {
  private readonly API_URL = 'http://localhost:5000/api/admin/reports';
  private readonly GOOGLE_SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  // Report data
  dashboardReport: any = null;
  inventoryReport: any = null;
  customerReport: any = null;
  salesReport: any = null;
  
  // UI state
  isLoading: { [key in ReportType]: boolean } = {
    dashboard: false,
    inventory: false,
    customers: false,
    sales: false
  };
  
  errorMessages: { [key in ReportType]: string } = {
    dashboard: '',
    inventory: '',
    customers: '',
    sales: ''
  };
  
  // Export state
  isExporting: { [key in ReportType]: boolean } = {
    dashboard: false,
    inventory: false,
    customers: false,
    sales: false
  };
  
  // URL for exported file
  exportUrl: string = '';
  importFormula: string = '';
  showExportModal: boolean = false;
  
  // Report selection
  selectedReport: ReportType = 'dashboard';
  
  // Date filters
  startDate: string = this.getLastMonthDate();
  endDate: string = this.getCurrentDate();
  
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardReport();
  }
  
  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      return new HttpHeaders({
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
  
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  private getLastMonthDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }
  
  onReportChange(): void {
    switch (this.selectedReport) {
      case 'dashboard':
        if (!this.dashboardReport) this.loadDashboardReport();
        break;
      case 'inventory':
        if (!this.inventoryReport) this.loadInventoryReport();
        break;
      case 'customers':
        if (!this.customerReport) this.loadCustomerReport();
        break;
      case 'sales':
        if (!this.salesReport) this.loadSalesReport();
        break;
    }
  }
  
  onDateChange(): void {
    // Reload the current report with new date filters
    if (this.selectedReport === 'customers') {
      this.loadCustomerReport();
    } else if (this.selectedReport === 'sales') {
      this.loadSalesReport();
    }
  }
  
  loadDashboardReport(): void {
    this.isLoading.dashboard = true;
    this.errorMessages.dashboard = '';
    
    this.getReport('dashboard', 'JSON').subscribe({
      next: (response) => {
        this.dashboardReport = response.data;
        this.isLoading.dashboard = false;
      },
      error: (error) => {
        this.errorMessages.dashboard = `Error loading dashboard report: ${error.message}`;
        this.isLoading.dashboard = false;
      }
    });
  }
  
  loadInventoryReport(): void {
    this.isLoading.inventory = true;
    this.errorMessages.inventory = '';
    
    this.getReport('inventory', 'JSON').subscribe({
      next: (response) => {
        this.inventoryReport = response.data;
        this.isLoading.inventory = false;
      },
      error: (error) => {
        this.errorMessages.inventory = `Error loading inventory report: ${error.message}`;
        this.isLoading.inventory = false;
      }
    });
  }
  
  loadCustomerReport(): void {
    this.isLoading.customers = true;
    this.errorMessages.customers = '';
    
    const startDateTime = `${this.startDate}T00:00:00`;
    const endDateTime = `${this.endDate}T23:59:59`;
    
    this.getReport('customers', 'JSON', startDateTime, endDateTime).subscribe({
      next: (response) => {
        this.customerReport = response.data;
        this.isLoading.customers = false;
      },
      error: (error) => {
        this.errorMessages.customers = `Error loading customer report: ${error.message}`;
        this.isLoading.customers = false;
      }
    });
  }
  
  loadSalesReport(): void {
    this.isLoading.sales = true;
    this.errorMessages.sales = '';
    
    const startDateTime = `${this.startDate}T00:00:00`;
    const endDateTime = `${this.endDate}T23:59:59`;
    
    this.getReport('sales', 'JSON', startDateTime, endDateTime).subscribe({
      next: (response) => {
        this.salesReport = response.data;
        this.isLoading.sales = false;
      },
      error: (error) => {
        this.errorMessages.sales = `Error loading sales report: ${error.message}`;
        this.isLoading.sales = false;
      }
    });
  }
  
  getReport(type: string, format: string, startDate?: string, endDate?: string): Observable<ReportResponse> {
    let url = `${this.API_URL}/${type}?format=${format}`;
    
    if (startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }
    
    return this.http.get<ReportResponse>(url, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching ${type} report:`, error);
          return of({
            success: false,
            message: `Failed to load ${type} report: ${error.message}`,
            data: null
          });
        })
      );
  }
  
  refreshCurrentReport(): void {
    switch (this.selectedReport) {
      case 'dashboard':
        this.loadDashboardReport();
        break;
      case 'inventory':
        this.loadInventoryReport();
        break;
      case 'customers':
        this.loadCustomerReport();
        break;
      case 'sales':
        this.loadSalesReport();
        break;
    }
  }
  
  formatCurrency(value: number): string {
    return value?.toFixed(2) || '0.00';
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Export to Google Sheets functionality
  exportToGoogleSheets(reportType: ReportType): void {
    this.isExporting[reportType] = true;
    const reportData = this.prepareReportDataForExport(reportType);
    
    // Create CSV content
    const csvContent = this.convertToCSV(reportData);
    
    // Create file name
    const fileName = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Upload to tmpfiles.org
    this.uploadToTmpFiles(csvContent, fileName).subscribe({
      next: (response) => {
        // Get the file URL from the response
        const fileUrl = this.extractFileUrl(response);
        
        if (fileUrl) {
          // Create IMPORTDATA formula
          const importFormula = `=IMPORTDATA("${fileUrl}")`;
          
          // Set the URL and formula for displaying in the UI
          this.exportUrl = fileUrl;
          this.importFormula = importFormula;
          this.showExportModal = true;
          
          // Copy formula to clipboard for convenience
          this.copyToClipboard(importFormula);
          
          this.isExporting[reportType] = false;
        } else {
          alert('Upload successful but could not retrieve the file URL. Please try again.');
          this.isExporting[reportType] = false;
        }
      },
      error: (error) => {
        console.error('Error uploading to tmpfiles.org:', error);
        alert('Failed to upload report to temporary hosting. Downloading locally instead.');
        
        // Fallback to local download
        this.downloadCsvLocally(csvContent, fileName);
        this.isExporting[reportType] = false;
      }
    });
  }
  
  openGoogleSheets(): void {
    window.open('https://docs.google.com/spreadsheets/create?usp=sheets_home', '_blank');
  }
  
  closeExportModal(): void {
    this.showExportModal = false;
  }
  
  copyUrl(): void {
    this.copyToClipboard(this.exportUrl);
    // Show temporary feedback
    const urlElement = document.getElementById('export-url');
    if (urlElement) {
      urlElement.classList.add('copied');
      setTimeout(() => {
        urlElement.classList.remove('copied');
      }, 1500);
    }
  }
  
  copyFormula(): void {
    this.copyToClipboard(this.importFormula);
    // Show temporary feedback
    const formulaElement = document.getElementById('import-formula');
    if (formulaElement) {
      formulaElement.classList.add('copied');
      setTimeout(() => {
        formulaElement.classList.remove('copied');
      }, 1500);
    }
  }
  
  private uploadToTmpFiles(csvContent: string, fileName: string): Observable<any> {
    // Create a FormData object to send the file
    const formData = new FormData();
    
    // Create a blob and add it to FormData
    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', blob, fileName);
    
    // Send POST request to tmpfiles.org API
    return this.http.post('https://tmpfiles.org/api/v1/upload', formData);
  }
  
  private extractFileUrl(response: any): string | null {
    try {
      // The actual tmpfiles.org API response format: 
      // {"status":"success","data":{"url":"https://tmpfiles.org/25584197/dashboard_report_2025-04-21.csv"}}
      if (response && response.status === 'success' && response.data && response.data.url) {
        const url = response.data.url;
        // Convert to download URL by adding "/dl" before the file ID
        // From: https://tmpfiles.org/25584197/dashboard_report_2025-04-21.csv
        // To:   https://tmpfiles.org/dl/25584197/dashboard_report_2025-04-21.csv
        return url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
      }
      return null;
    } catch (error) {
      console.error('Error extracting file URL:', error);
      return null;
    }
  }
  
  private getGoogleAppsScript(fileUrl: string): string {
    // Create a Google Apps Script that imports data from the URL
    return `/**
 * CliqShop Report Importer
 * This script imports report data from a temporary URL into Google Sheets
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('CliqShop Reports')
    .addItem('Import Report Data', 'importReportData')
    .addToUi();
}

function importReportData() {
  var url = "${fileUrl}";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  // Clear the current sheet
  sheet.clear();
  
  // Fetch CSV data from the URL
  var response = UrlFetchApp.fetch(url);
  var csvData = Utilities.parseCsv(response.getContentText());
  
  // Write data to the sheet
  if (csvData && csvData.length > 0) {
    var numRows = csvData.length;
    var numCols = csvData[0].length;
    
    if (numRows > 0 && numCols > 0) {
      // Get the range to write to
      var range = sheet.getRange(1, 1, numRows, numCols);
      
      // Set the values
      range.setValues(csvData);
      
      // Format the header row
      var headerRange = sheet.getRange(1, 1, 1, numCols);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f3f3");
      
      // Auto-resize columns
      for (var i = 1; i <= numCols; i++) {
        sheet.autoResizeColumn(i);
      }
      
      // Add filter
      range.createFilter();
      
      SpreadsheetApp.getUi().alert("Report data imported successfully!");
    } else {
      SpreadsheetApp.getUi().alert("No data found in the CSV file.");
    }
  } else {
    SpreadsheetApp.getUi().alert("Failed to parse CSV data from URL.");
  }
}

// Run the import automatically when the script is run
function runImport() {
  importReportData();
}`;
  }
  
  private copyToClipboard(text: string): void {
    // Create a temporary textarea element to copy text to clipboard
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    // Select and copy the text
    textarea.select();
    document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textarea);
  }
  
  private downloadCsvLocally(csvContent: string, fileName: string): void {
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  prepareReportDataForExport(reportType: ReportType): any[] {
    switch (reportType) {
      case 'dashboard':
        // For dashboard, we'll export both top products and top customers
        if (this.dashboardReport?.summary?.topProducts) {
          return this.dashboardReport.summary.topProducts.map((product: any) => ({
            'Product Name': product.productName,
            'Category': product.category,
            'Price': product.price,
            'Quantity Sold': product.quantitySold,
            'Revenue': product.revenue,
            'Current Stock': product.currentStock
          }));
        }
        return [];
        
      case 'inventory':
        if (this.inventoryReport?.data) {
          return this.inventoryReport.data.map((product: any) => ({
            'Product ID': product.productId,
            'Product Name': product.productName,
            'Category': product.category,
            'Price': product.price,
            'Current Stock': product.currentStock,
            'Stock Status': product.stockStatus
          }));
        }
        return [];
        
      case 'customers':
        if (this.customerReport?.data) {
          return this.customerReport.data.map((customer: any) => ({
            'Customer Name': customer.customerName,
            'Email': customer.email,
            'Orders': customer.orderCount,
            'Average Order Value': customer.averageOrderValue,
            'Total Spent': customer.totalSpent
          }));
        }
        return [];
        
      case 'sales':
        if (this.salesReport?.data) {
          return this.salesReport.data.map((order: any) => ({
            'Order ID': order.orderId,
            'Customer': order.customer,
            'Date': this.formatDate(order.orderDate),
            'Amount': order.amount,
            'Status': order.status
          }));
        }
        return [];
        
      default:
        return [];
    }
  }
  
  convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create header row
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        // Handle values that may need wrapping in quotes (like strings with commas)
        const cell = item[header]?.toString() || '';
        return cell.includes(',') ? `"${cell}"` : cell;
      }).join(',');
      csvContent += row + '\n';
    });
    
    return csvContent;
  }
  
  // Google Sheets direct integration (placeholder - would require OAuth and proper implementation)
  createGoogleSheet(title: string, data: any[]): void {
    console.log('This would create a Google Sheet with the following data:', title, data);
    // In a real implementation, this would use the Google Sheets API to create a spreadsheet
    // It would require OAuth authentication and proper API integration
  }
} 