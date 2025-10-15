import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface AdminStatsOut {
  users_count: number;
  overlays_count: number;
  moderators_count: number;
  admins_count: number;
  active_2fa_count: number;
  last_user_registered_at: string; // ISO
}

export interface AdminUsersListOut {
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

export type AdminRole = 'user' | 'moderator' | 'admin';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getStats() {
    return this.http.get<AdminStatsOut>('admin/stats');
  }

  listUsers(opts?: { page?: number; page_size?: number; search?: string | null }) {
    let params = new HttpParams();
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.page_size) params = params.set('page_size', String(opts.page_size));
    if (opts?.search) params = params.set('search', opts.search);
    return this.http.get<AdminUsersListOut>('admin/users', { params });
  }

  updateUserRole(userId: string, role: AdminRole) {
    return this.http.patch<string>(`admin/users/${encodeURIComponent(userId)}/role`, { role });
  }
}
