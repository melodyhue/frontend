import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface ModoUsersListOut {
  items: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
    last_login_at: string | null;
  }>;
  total: number;
  page: number;
  page_size: number;
}

export interface ModoUserOut {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
}

export interface ModoOverlaysListOut {
  items?: unknown[] | string; // l'API renvoie "string" dans l'exemple, garder souple
  total?: number;
  page?: number;
  page_size?: number;
}

export interface ModoOverlayOut {
  id: string;
  name: string;
  template: string;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ModerationService {
  private readonly http = inject(HttpClient);

  listUsers(opts?: { page?: number; page_size?: number; search?: string | null }) {
    let params = new HttpParams();
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.page_size) params = params.set('page_size', String(opts.page_size));
    if (opts?.search) params = params.set('search', opts.search);
    return this.http.get<ModoUsersListOut>('modo/users', { params });
  }

  viewUser(userId: string) {
    return this.http.get<ModoUserOut>(`modo/users/${encodeURIComponent(userId)}`);
  }

  editUser(userId: string, payload: Record<string, unknown>) {
    return this.http.patch<string>(`modo/users/${encodeURIComponent(userId)}`, payload);
  }

  warnUser(userId: string, reason: string) {
    return this.http.post<string>(`modo/users/${encodeURIComponent(userId)}/warn`, { reason });
  }

  banUser(userId: string, payload: { reason: string; until?: string }) {
    return this.http.post<string>(`modo/users/${encodeURIComponent(userId)}/ban`, payload);
  }

  revokeBan(userId: string) {
    return this.http.post<string>(`modo/users/${encodeURIComponent(userId)}/ban/revoke`, {});
  }

  listOverlays(opts?: {
    page?: number;
    page_size?: number;
    owner_id?: string | null;
    search?: string | null;
  }) {
    let params = new HttpParams();
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.page_size) params = params.set('page_size', String(opts.page_size));
    if (opts?.owner_id) params = params.set('owner_id', opts.owner_id);
    if (opts?.search) params = params.set('search', opts.search);
    return this.http.get<ModoOverlaysListOut>('modo/overlays', { params });
  }

  viewOverlay(overlayId: string) {
    return this.http.get<ModoOverlayOut>(`modo/overlays/${encodeURIComponent(overlayId)}`);
  }

  editOverlay(overlayId: string, payload: Record<string, unknown>) {
    return this.http.patch<string>(`modo/overlays/${encodeURIComponent(overlayId)}`, payload);
  }

  deleteOverlay(overlayId: string) {
    return this.http.delete<string>(`modo/overlays/${encodeURIComponent(overlayId)}`);
  }
}
