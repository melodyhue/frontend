import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  LoginIn,
  LoginStep1Out,
  Login2FAIn,
  TokenPair,
  RefreshIn,
  AuthState,
  RegisterIn,
  ForgotPwdIn,
  ResetPwdIn,
  TwoFASetupOut,
  TwoFAVerifyIn,
  LoginTokensOut,
} from '../models/auth.model';
import { UserOut } from '../models/user.model';
import {
  AUTH_SESSION_PREF_KEY,
  AUTH_TICKET_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
} from '../constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  loginStep1(payload: LoginIn) {
    return this.http.post<LoginStep1Out | LoginTokensOut>('auth/login', payload);
  }

  loginStep2Totp(payload: Login2FAIn) {
    return this.http.post<TokenPair>('auth/login/2fa', payload);
  }

  refresh(payload: RefreshIn) {
    return this.http.post<TokenPair>('auth/refresh', payload);
  }

  me() {
    return this.http.get<UserOut>('users/me');
  }

  register(payload: RegisterIn) {
    return this.http.post<LoginTokensOut | UserOut>('auth/register', payload);
  }

  forgotPassword(payload: ForgotPwdIn) {
    return this.http.post<void>('auth/forgot', payload);
  }

  resetPassword(payload: ResetPwdIn) {
    return this.http.post<void>('auth/reset', payload);
  }

  twoFASetup() {
    return this.http.post<TwoFASetupOut>('auth/2fa/setup', {});
  }

  twoFAVerify(payload: TwoFAVerifyIn) {
    return this.http.post<void>('auth/2fa/verify', payload);
  }

  storeTicket(ticket: string | null) {
    if (!this.isBrowser) return;
    if (!ticket) {
      try {
        localStorage.removeItem(AUTH_TICKET_STORAGE_KEY);
      } catch {}
      return;
    }
    try {
      localStorage.setItem(AUTH_TICKET_STORAGE_KEY, ticket);
    } catch {}
  }

  readTicket(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(AUTH_TICKET_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  storeSessionPreference(session: 'persistent' | 'session') {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(AUTH_SESSION_PREF_KEY, session);
    } catch {}
  }

  readSessionPreference(): 'persistent' | 'session' | null {
    if (!this.isBrowser) return null;
    try {
      const v = localStorage.getItem(AUTH_SESSION_PREF_KEY);
      return v === 'persistent' || v === 'session' ? v : null;
    } catch {
      return null;
    }
  }

  storeTokenPair(tokens: TokenPair) {
    if (!this.isBrowser) return;
    const session = this.readSessionPreference() ?? 'session';
    const state: AuthState = {
      ...tokens,
      session,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  storeLoginTokens(tokens: LoginTokensOut) {
    // Stocke les tokens + user_id/role si fournis
    this.storeTokenPair(tokens);
    this.updateAuthState({ user_id: tokens.user_id, role: tokens.role });
  }

  updateAuthState(patch: Partial<AuthState>) {
    if (!this.isBrowser) return;
    try {
      const existingRaw = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const existing: AuthState | null = existingRaw ? JSON.parse(existingRaw) : null;
      const merged = { ...(existing ?? {}), ...patch } as AuthState;
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  }

  readAuthState(): AuthState | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthState) : null;
    } catch {
      return null;
    }
  }

  clearAuth() {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_TICKET_STORAGE_KEY);
    } catch {}
  }
}
