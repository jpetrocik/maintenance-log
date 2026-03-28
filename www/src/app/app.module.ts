import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, AuthInterceptor } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatInputModule} from '@angular/material/input';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule} from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ServiceModule } from './service/service.module';
import { MileageModule } from './mileage/mileage.module';
import { HomeModule } from './home/home.module';
import { LoginModule } from './login/login.module';
import { VehicleRegistrationModule } from './vehicle-registration/vehicle-registration.module';

@NgModule({ declarations: [
        AppComponent,
        ShareComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatSnackBarModule,
        MatIconModule,
        MatToolbarModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule,
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
        {
            provide: HTTP_INTERCEPTORS,
            useFactory: function (router: Router) {
                return new AuthInterceptor(router);
            },
            multi: true,
            deps: [Router]
        },
    ] })
export class AppModule { }