import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const debugInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();
  console.log(`🌐 [API Request] ${req.method} ${req.url}`);
  console.log('Request Headers:', req.headers.keys().map(key => `${key}: ${req.headers.get(key)}`));
  
  if (req.body) {
    console.log('Request Body:', req.body);
  }

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`✅ [API Response] ${req.method} ${req.url} - Status: ${event.status} (${duration}ms)`);
          console.log('Response Body:', event.body);
        }
      },
      error: (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.error(`❌ [API Error] ${req.method} ${req.url} - Status: ${error.status} (${duration}ms)`);
        console.error('Error:', error.error);
        console.error('Message:', error.message);
      }
    })
  );
}; 