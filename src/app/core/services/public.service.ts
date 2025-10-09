import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PublicColorResponse {
  color?: { hex?: string };
}

export interface PublicTrackInfo {
  id?: string;
  name?: string;
  artist?: string;
  album?: string;
  image_url?: string;
  is_playing?: boolean;
  duration_ms?: number;
  progress_ms?: number;
}

export interface PublicInfosResponse {
  color?: { hex?: string };
  track?: PublicTrackInfo | null;
}

@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly http = inject(HttpClient);
  // URLs relatives: l'intercepteur préfixera avec API_BASE_URL

  infos(user_id: string) {
    return this.http.get<PublicInfosResponse>(`infos/${encodeURIComponent(user_id)}`);
  }

  color(user_id: string) {
    return this.http.get<PublicColorResponse>(`color/${encodeURIComponent(user_id)}`);
  }

  health() {
    return this.http.get<unknown>('health');
  }

  getUserPublic(user_id: string) {
    return this.http.get<unknown>(`users/${encodeURIComponent(user_id)}`);
  }
}
