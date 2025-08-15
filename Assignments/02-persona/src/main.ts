import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';

const appConfig = {
  providers: [
    provideHttpClient(),             // ✅ HttpClient for standalone component
    importProvidersFrom(FormsModule) // ✅ FormsModule for [(ngModel)]
  ]
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
