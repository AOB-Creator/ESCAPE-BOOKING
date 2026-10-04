import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { LOCAL_DATA_PROVIDERS } from './core/data/local-adapters';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    // Prototype adapters (localStorage). Replace with HTTP adapters for
    // Exely PMS / booking engine and Payme, Click, Uzum, Uzcard/Humo.
    ...LOCAL_DATA_PROVIDERS,
  ],
};
