import { InjectionToken } from '@angular/core';

/**
 * Base URL de l'API MelodyHue (ex: https://api.melodyhue.com)
 * Fournie globalement dans app.config.ts via { provide: API_BASE_URL, useValue: '...' }.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
