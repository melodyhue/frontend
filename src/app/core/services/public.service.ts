import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly http = inject(HttpClient);

  infos(user_id: string) {
    return this.http.get<unknown>(`infos/${encodeURIComponent(user_id)}`);
  }

  color(user_id: string) {
    return this.http.get<unknown>(`color/${encodeURIComponent(user_id)}`);
  }

  health() {
    return this.http.get<unknown>('health');
  }

  getUserPublic(user_id: string) {
    return this.http.get<unknown>(`users/${encodeURIComponent(user_id)}`);
  }
}
