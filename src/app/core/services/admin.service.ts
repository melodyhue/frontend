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

export interface AdminUserWarningItem {
  id: string;
  user_id: string;
  user_username: string;
  user_email: string;
  moderator_id: string;
  moderator_username: string;
  moderator_email: string;
  reason: string;
  created_at: string; // ISO date-time
}

export interface AdminUserWarningsOut {
  items: AdminUserWarningItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminAllWarningsOut {
  items: AdminUserWarningItem[];
  total: number;
  page: number;
  page_size: number;
}

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

  getUserWarnings(userId: string, opts?: { page?: number; page_size?: number }) {
    let params = new HttpParams();
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.page_size) params = params.set('page_size', String(opts.page_size));
    return this.http.get<AdminUserWarningsOut>(
      `admin/users/${encodeURIComponent(userId)}/warnings`,
      { params }
    );
  }

  listAllWarnings(opts?: { page?: number; page_size?: number; search?: string | null }) {
    let params = new HttpParams();
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.page_size) params = params.set('page_size', String(opts.page_size));
    if (opts?.search) params = params.set('search', opts.search);
    return this.http.get<AdminAllWarningsOut>('admin/warnings', { params });
  }

  // Delete all warnings for a user
  deleteUserWarnings(userId: string) {
    return this.http.delete<string>(`admin/users/${encodeURIComponent(userId)}/warnings`);
  }

  // Delete a single warning by id
  deleteWarning(warningId: string) {
    return this.http.delete<string>(`admin/warnings/${encodeURIComponent(warningId)}`);
  }
}
