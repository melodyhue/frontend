import { Injectable, PLATFORM_ID, inject, isDevMode, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of, tap } from 'rxjs';
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
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
} from '../constants/storage-keys';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  COOKIE_TOKEN_TYPE,
} from '../constants/cookie-keys';
import { getCookie, setCookie, deleteCookie } from '../utils/cookie.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  // DEV: ne pas persister les tokens en localStorage (cookies uniquement + mémoire)
  private readonly devPersistAll = false;
  // Token d'accès en mémoire uniquement
  private readonly accessToken = signal<string | null>(null);
  // Refresh token en mémoire uniquement (fallback si les cookies HttpOnly ne sont pas disponibles)
  private readonly refreshToken = signal<string | null>(null);

  loginStep1(payload: LoginIn) {
    // withCredentials: true pour accepter les Set-Cookie cross-site (refresh cookie)
    return this.http
      .post<LoginStep1Out | LoginTokensOut>('auth/login', payload, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => {},
          error: () => {},
        })
      );
  }

  loginStep2Totp(payload: Login2FAIn) {
    return this.http
      .post<TokenPair>('auth/login/2fa', payload, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => {},
          error: () => {},
        })
      );
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
    return this.http
      .post<TokenPair>('auth/refresh', undefined, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (_: TokenPair) => {},
          error: (_: HttpErrorResponse) => {},
        })
      );
  }

  me() {
    return this.http.get<UserOut>('users/me', { withCredentials: true });
  }

  logout() {
    // Demande au backend d'effacer les cookies HttpOnly (access/refresh)
    return this.http.post<{ status?: string }>('auth/logout', {}, { withCredentials: true }).pipe(
      catchError((err) => {
        // Même si l'API renvoie une erreur, on poursuivra le nettoyage client
        console.warn('Logout API call failed, proceeding to clear client state', err);
        return of({ status: 'client-cleared' });
      }),
      finalize(() => {
        // Nettoyage côté client dans tous les cas
        this.clearAuth();
      })
    );
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
    return this.http.post<TwoFASetupOut>('auth/2fa/setup', {}, { withCredentials: true });
  }

  twoFAVerify(payload: TwoFAVerifyIn) {
    return this.http.post<void>('auth/2fa/verify', payload, { withCredentials: true });
  }

  // 2FA disable (avec code TOTP)
  twoFADisableWithCode(code: string) {
    return this.http.post<{ status: 'disabled' }>(
      'auth/2fa/disable',
      { code },
      { withCredentials: true }
    );
  }

  // 2FA disable - demande email
  twoFADisableRequest() {
    return this.http.post<{ status: 'sent'; email_sent: boolean; token?: string }>(
      'auth/2fa/disable/request',
      {},
      { withCredentials: true }
    );
  }

  // 2FA disable - confirmation via token
  twoFADisableConfirm(token: string) {
    // le backend accepte form/JSON simple; on envoie JSON
    return this.http.post<{ status: 'disabled' }>(
      'auth/2fa/disable/confirm',
      { token },
      { withCredentials: true }
    );
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
    // Désactivé: on ne persiste plus l'état d'authentification en localStorage
  }

  storeTokenPair(tokens: TokenPair) {
    const { access_token } = tokens;
    const token_type = (tokens.token_type || 'bearer') as string;
    // Mémoire
    this.accessToken.set(access_token || null);
    // Plus de persistance en localStorage pour l'access_token

    // Refresh token: mémoire + persistance DEV
    const rt = (tokens as any)?.refresh_token as string | undefined;
    if (typeof rt === 'string' && rt.length > 0) {
      this.refreshToken.set(rt);
      // Plus de persistance en localStorage pour le refresh_token
    }

    // Ecrire aussi dans des cookies non-HttpOnly pour dev (visible via document.cookie)
    if (this.isBrowser && isDevMode()) {
      try {
        const secure = location.protocol === 'https:';
        setCookie(COOKIE_ACCESS_TOKEN, access_token || '', {
          path: '/',
          secure,
          sameSite: secure ? 'None' : 'Lax',
          maxAgeSeconds: 60 * 60, // 1h pour l'access token (à adapter)
        });
        setCookie(COOKIE_TOKEN_TYPE, token_type, {
          path: '/',
          secure,
          sameSite: secure ? 'None' : 'Lax',
          maxAgeSeconds: 60 * 60,
        });
        if (rt) {
          setCookie(COOKIE_REFRESH_TOKEN, rt, {
            path: '/',
            secure,
            sameSite: secure ? 'None' : 'Lax',
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours pour le refresh (à adapter)
          });
        }
      } catch {}
    }
  }

  storeLoginTokens(tokens: LoginTokensOut) {
    // Stocke uniquement les jetons nécessaires côté client; le refresh est géré via cookie HttpOnly
    this.storeTokenPair(tokens);
    // Ne pas stocker le rôle ni l'identifiant utilisateur côté client
    // L'ID utilisateur doit être récupéré via l'API (users/me)
  }

  // Fournit le token d'accès courant (mémoire)
  getAccessToken(): string | null {
    const mem = this.accessToken();
    if (mem) return mem;
    // Fallback cookies non-HttpOnly (DEV)
    if (this.isBrowser) {
      try {
        const fromCookie = getCookie(COOKIE_ACCESS_TOKEN);
        if (fromCookie) {
          this.accessToken.set(fromCookie);
          return fromCookie;
        }
      } catch {}
    }
    return null;
  }

  // Fournit le refresh token en mémoire (si disponible)
  getRefreshToken(): string | null {
    const rt = this.refreshToken();
    if (rt) return rt;
    // Fallback cookies non-HttpOnly (DEV)
    if (this.isBrowser) {
      try {
        const fromCookie = getCookie(COOKIE_REFRESH_TOKEN);
        return fromCookie || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Pour compat: retourne un état synthétique basé sur le token en mémoire
  readAuthState(): AuthState | null {
    const access = this.accessToken();
    if (access) {
      return {
        access_token: access,
        createdAt: new Date().toISOString(),
        session: this.readSessionPreference() ?? 'session',
      } as AuthState;
    }
    // Fallback cookie
    if (this.isBrowser) {
      try {
        const fromCookie = getCookie(COOKIE_ACCESS_TOKEN);
        if (fromCookie) {
          return {
            access_token: fromCookie,
            createdAt: new Date().toISOString(),
            session: this.readSessionPreference() ?? 'session',
          } as AuthState;
        }
      } catch {}
    }
    return null;
  }

  // Indice local qu'un utilisateur a (ou a eu) une session côté client
  // Permet d'éviter de tenter un refresh quand il n'y a aucune preuve côté client
  hasClientAuthEvidence(): boolean {
    if (!this.isBrowser) return false;
    // Access token en mémoire ou cookie (dev)
    const access = this.accessToken();
    if (access) return true;
    try {
      const cAccess = getCookie(COOKIE_ACCESS_TOKEN);
      if (cAccess) return true;
    } catch {}
    // Refresh token en mémoire ou cookie (dev)
    const rt = this.refreshToken();
    if (rt) return true;
    try {
      const cRt = getCookie(COOKIE_REFRESH_TOKEN);
      if (cRt) return true;
    } catch {}
    return false;
  }

  clearAuth() {
    if (!this.isBrowser) return;
    // Purge mémoire + ticket éventuel
    this.accessToken.set(null);
    this.refreshToken.set(null);
    try {
      window.localStorage.removeItem(AUTH_TICKET_STORAGE_KEY);
      // DEV ONLY: nettoyer aussi le refresh token persistant
      window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
      if (this.devPersistAll) {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
      // Nettoyer cookies non-HttpOnly
      deleteCookie(COOKIE_ACCESS_TOKEN, { path: '/' });
      deleteCookie(COOKIE_REFRESH_TOKEN, { path: '/' });
      deleteCookie(COOKIE_TOKEN_TYPE, { path: '/' });
    } catch {}
  }
}
