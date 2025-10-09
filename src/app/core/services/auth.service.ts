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
    // withCredentials: true pour accepter les Set-Cookie cross-site (refresh cookie)
    return this.http.post<LoginStep1Out | LoginTokensOut>('auth/login', payload, {
      withCredentials: true,
    });
  }

  loginStep2Totp(payload: Login2FAIn) {
    return this.http.post<TokenPair>('auth/login/2fa', payload, {
      withCredentials: true,
    });
  }

  // Ancienne méthode (payload) conservée pour compat si le backend l'exige encore,
  // mais préférer refreshWithCookie qui s'appuie sur un cookie HttpOnly
  refresh(payload: RefreshIn) {
    return this.http.post<TokenPair>('auth/refresh', payload, {
      withCredentials: true,
    });
  }

  // Nouvelle méthode recommandée: le serveur lit le refresh token depuis un cookie HttpOnly
  refreshWithCookie() {
    return this.http.post<TokenPair>(
      'auth/refresh',
      {},
      {
        withCredentials: true,
      }
    );
  }

  me() {
    return this.http.get<UserOut>('users/me');
  }

  register(payload: RegisterIn) {
    return this.http.post<LoginTokensOut | UserOut>('auth/register', payload, {
      withCredentials: true,
    });
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

  private getStorageFor(session: 'persistent' | 'session'): Storage | null {
    if (!this.isBrowser) return null;
    try {
      return session === 'session' ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  }

  private readFromStorages(): AuthState | null {
    if (!this.isBrowser) return null;
    try {
      // Priorité à sessionStorage
      const sraw = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (sraw) return JSON.parse(sraw) as AuthState;
    } catch {}
    try {
      const lraw = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (lraw) return JSON.parse(lraw) as AuthState;
    } catch {}
    return null;
  }

  private writeState(state: AuthState) {
    if (!this.isBrowser) return;
    const session = state.session ?? this.readSessionPreference() ?? 'session';
    const store = this.getStorageFor(session);
    if (!store) return;
    try {
      store.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  storeTokenPair(tokens: TokenPair) {
    if (!this.isBrowser) return;
    const session = this.readSessionPreference() ?? 'session';
    // Ne pas persister le refresh_token côté client
    const { access_token, token_type } = tokens;
    const state: AuthState = {
      access_token,
      token_type,
      session,
      createdAt: new Date().toISOString(),
    } as AuthState;
    this.writeState(state);
  }

  storeLoginTokens(tokens: LoginTokensOut) {
    // Stocke access token + user_id/role si fournis; refresh cookie géré par le serveur
    this.storeTokenPair(tokens);
    this.updateAuthState({ user_id: tokens.user_id, role: tokens.role });
  }

  updateAuthState(patch: Partial<AuthState>) {
    if (!this.isBrowser) return;
    const existing = this.readFromStorages();
    const merged = { ...(existing ?? {}), ...patch } as AuthState;
    this.writeState(merged);
  }

  readAuthState(): AuthState | null {
    return this.readFromStorages();
  }

  clearAuth() {
    if (!this.isBrowser) return;
    try {
      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {}
    try {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {}
    try {
      window.localStorage.removeItem(AUTH_TICKET_STORAGE_KEY);
    } catch {}
  }
}
