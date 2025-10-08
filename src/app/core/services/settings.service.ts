import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SettingsPayload } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  getSettings() {
    return this.http.get<unknown>('settings/me');
  }

  updateSettings(payload: SettingsPayload) {
    return this.http.patch<unknown>('settings/me', payload);
  }
}
