import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ShareComponent } from './share/share.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { MaterialModule } from './material.module';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ServiceModule } from './service/service.module';
import { MileageModule } from './mileage/mileage.module';
import { HomeModule } from './home/home.module';
import { LoginModule } from './login/login.module';
import { VehicleRegistrationModule } from './vehicle-registration/vehicle-registration.module';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

function initializeAppFactory(authService: AuthService): () => Observable<any> {
  return () => authService.verifySession();
}

@NgModule({
    declarations: [
        AppComponent,
        ShareComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MaterialModule,
        CommonModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
            registrationStrategy: 'registerWhenStable:30000'
        }),
        ServiceModule,
        MileageModule,
        HomeModule,
        LoginModule,
        VehicleRegistrationModule], providers: [
            { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
            { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
            {
                provide: APP_INITIALIZER,
                useFactory: initializeAppFactory,
                deps: [AuthService],
                multi: true
            }
        ]
})
export class AppModule { }
