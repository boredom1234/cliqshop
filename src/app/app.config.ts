import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, HttpXhrBackend, HTTP_INTERCEPTORS, HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { catchError, of, throwError, Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { debugInterceptor } from './core/interceptors/debug.interceptor';

// Create a minimal error interceptor that doesn't add or check for custom headers
class SuppressErrorsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: any) => {
        // Only check URL patterns, not custom headers
        if (error.status === 401 && req.url.includes('/api/cart')) {
          console.log('Suppressing 401 error for cart endpoint:', req.url);
          // Return an empty response with cart data structure
          return of(new HttpResponse({ 
            body: { 
              success: false,
              message: 'Authentication required',
              items: [],
              totalItems: 0,
              subtotal: 0
            }, 
            status: 200 
          }));
        }
        
        // For CORS errors, provide a clearer message
        if (error.status === 0 && error.name === 'HttpErrorResponse' && 
            error.message && error.message.indexOf('CORS') > -1) {
          console.warn('CORS error detected:', error.message);
          console.warn('This is likely a server configuration issue with CORS headers');
          // Don't modify the error, just log it
        }
        
        // Pass through all other errors
        return throwError(() => error);
      })
    );
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor, debugInterceptor])
    ),
    // Add ng2-charts configuration
    provideCharts(withDefaultRegisterables()),
    // Add custom error suppression
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SuppressErrorsInterceptor,
      multi: true
    }
  ]
};
