import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

/**
 * Retourne les providers de test standard pour résoudre les dépendances communes.
 * Utiliser dans TestBed.configureTestingModule({ providers: [...getTestProviders(), ...autresProviders] })
 */
export function getTestProviders(): (EnvironmentProviders | Provider)[] {
  return [provideHttpClient(), provideHttpClientTesting(), provideRouter([])];
}

/**
 * Retourne les providers de test standard + mock d'ActivatedRoute.
 * Pour les composants qui injectent ActivatedRoute.
 */
export function getTestProvidersWithRoute(): (EnvironmentProviders | Provider)[] {
  const paramMap = new Map();
  return [
    ...getTestProviders(),
    {
      provide: ActivatedRoute,
      useValue: {
        snapshot: {
          params: {},
          queryParams: {},
          data: {},
          paramMap: paramMap,
          queryParamMap: new Map(),
        },
        params: of({}),
        queryParams: of({}),
        data: of({}),
        paramMap: of(paramMap),
        queryParamMap: of(new Map()),
      },
    },
  ];
}
