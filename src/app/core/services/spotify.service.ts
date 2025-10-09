import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface SpotifyCredentialsStatus {
  has_client_id: boolean;
  has_client_secret: boolean;
  has_refresh_token: boolean;
}

export type UpdateSpotifyCredentialsPayload = Partial<{
  client_id: string;
  client_secret: string;
  refresh_token: string;
}>;

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private readonly http = inject(HttpClient);

  getCredentialsStatus() {
    return this.http.get<SpotifyCredentialsStatus>('spotify/credentials/status');
  }

  updateCredentials(payload: UpdateSpotifyCredentialsPayload) {
    return this.http.patch<void>('spotify/credentials', payload);
  }

  // GET /spotify/auth/url?redirect_uri=...
  getAuthUrl(redirectUri?: string) {
    const options: { params?: Record<string, string>; observe: 'body' } = { observe: 'body' };
    if (redirectUri) options.params = { redirect_uri: redirectUri };
    return this.http.get<{ url: string }>('spotify/auth/url', options);
  }

  // GET /spotify/callback?code=...&redirect_uri=...
  // Renvoie typiquement 200 si échange effectué, et stocke refresh_token côté serveur
  handleCallback(code: string, redirectUri?: string) {
    const params: Record<string, string> = { code };
    if (redirectUri) params['redirect_uri'] = redirectUri;
    return this.http.get<void>('spotify/callback', { params });
  }
}
