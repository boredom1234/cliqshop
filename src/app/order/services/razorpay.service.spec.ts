import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { RazorpayService, RazorpayOrder, RazorpayPaymentResponse } from './razorpay.service';
import { ApiConfigService } from '../../core/services/api-config.service';

describe('RazorpayService', () => {
  let service: RazorpayService;
  let httpMock: HttpTestingController;
  let apiConfigServiceSpy: jasmine.SpyObj<ApiConfigService>;

  beforeEach(() => {
    const apiConfigSpy = jasmine.createSpyObj('ApiConfigService', ['getUrl', 'getAuthHeaders']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RazorpayService,
        { provide: ApiConfigService, useValue: apiConfigSpy }
      ]
    });
    
    service = TestBed.inject(RazorpayService);
    httpMock = TestBed.inject(HttpTestingController);
    apiConfigServiceSpy = TestBed.inject(ApiConfigService) as jasmine.SpyObj<ApiConfigService>;
    
    apiConfigServiceSpy.getUrl.and.returnValue('https://example.com/api/razorpay-create-order');
    
    // Create headers properly
    const headers = new HttpHeaders({
      'Authorization': 'Bearer test-token'
    });
    apiConfigServiceSpy.getAuthHeaders.and.returnValue(headers);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a Razorpay order', () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'order_123456',
        amount: 50000,
        currency: 'INR',
        receipt: 'receipt_123'
      }
    };
    
    service.createOrder(50000, 'INR', 'receipt_123').subscribe(order => {
      expect(order).toEqual(mockResponse.data);
    });
    
    const req = httpMock.expectOne('https://example.com/api/razorpay-create-order');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      amount: 50000,
      currency: 'INR',
      receipt: 'receipt_123'
    });
    
    req.flush(mockResponse);
  });

  it('should handle errors when creating an order and return mock data for development', () => {
    apiConfigServiceSpy.getUrl.and.returnValue('https://example.com/api/error');
    
    service.createOrder(50000).subscribe(order => {
      expect(order.id).toContain('order_');
      expect(order.amount).toBe(50000);
      expect(order.currency).toBe('INR');
    });
    
    const req = httpMock.expectOne('https://example.com/api/error');
    req.error(new ErrorEvent('Network error'));
  });

  it('should verify payment', () => {
    const mockPaymentResponse: RazorpayPaymentResponse = {
      razorpay_payment_id: 'pay_123456',
      razorpay_order_id: 'order_123456',
      razorpay_signature: 'signature_123456'
    };
    
    const mockVerifyResponse = {
      success: true
    };
    
    apiConfigServiceSpy.getUrl.and.returnValue('https://example.com/api/razorpay-verify-payment');
    
    service.verifyPayment(mockPaymentResponse).subscribe(response => {
      expect(response.success).toBe(true);
    });
    
    const req = httpMock.expectOne('https://example.com/api/razorpay-verify-payment');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockPaymentResponse);
    
    req.flush(mockVerifyResponse);
  });
}); 