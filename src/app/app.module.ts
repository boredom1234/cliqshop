import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app-routing.module';

// Note: Auth interceptor is now registered in main.ts using the functional interceptor pattern
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)
  ]
}); 