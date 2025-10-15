import { Injectable, inject, signal } from '@angular/core';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import { AuthService } from './auth.service';
import { SessionRefreshService } from './session-refresh.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly baseUrl = inject(API_BASE_URL, { optional: true }) as string | undefined;
  private readonly auth = inject(AuthService);
  private readonly sessionRefresh = inject(SessionRefreshService);
  private readonly router = inject(Router);

  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private stopped = false;
  private connecting = false;
  private refreshingForWs = false;
  private refreshFailedLock = false;

  readonly connected = signal(false);
  readonly lastError = signal<string | null>(null);

  private forceLogout(reason: 'banned' | 'expired' | 'unauthorized' | 'unknown' = 'unknown') {
    try {
      this.sessionRefresh.stop();
    } catch {}
    try {
      this.auth.clearAuth();
    } catch {}
    this.stop();
    // Utiliser setTimeout pour éviter conflits de cycle
    setTimeout(() => this.router.navigate(['/login'], { queryParams: { reason } }), 0);
  }

  start(): void {
    this.stopped = false;
    if (this.ws || this.connected() || this.connecting) return;
    // S'assurer d'avoir un access_token si possible (cookie refresh -> token mémoire)
    const haveToken = !!this.auth.getAccessToken();
    if (!haveToken && !this.refreshingForWs && !this.refreshFailedLock) {
      this.refreshingForWs = true;
      // eslint-disable-next-line no-console
      console.debug('[WS] no access token; trying refreshWithCookie before connecting');
      this.auth.refreshWithCookie().subscribe({
        next: (tokens) => {
          try {
            this.auth.storeTokenPair(tokens);
          } catch {}
          this.refreshingForWs = false;
          this.start();
        },
        error: () => {
          this.refreshingForWs = false;
          // Marquer l'échec pour éviter une boucle de refresh
          this.refreshFailedLock = true;
          // On tentera quand même la connexion (cookie HttpOnly pourrait suffire)
          // mais ne pas relancer start() immédiatement pour éviter boucle; continuer plus bas
        },
      });
      // On laisse la suite continuer si refresh a réussi (start recall) sinon on poursuivra la connexion sans token
      return;
    }

    this.connecting = true;
    const url = this.computeWsUrl();
    // Debug: log l'URL (token masqué)
    try {
      const u = new URL(url);
      const t = u.searchParams.get('token');
      if (t) {
        u.searchParams.set('token', t.slice(0, 6) + '…');
      }
      // eslint-disable-next-line no-console
      console.debug('[WS] connecting to', u.toString());
    } catch {}
    try {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => {
        this.connected.set(true);
        this.lastError.set(null);
        this.connecting = false;
      };
      ws.onmessage = (ev: MessageEvent) => {
        this.handleMessage(ev.data);
      };
      ws.onerror = () => {
        this.lastError.set('ws_error');
      };
      ws.onclose = (ev: CloseEvent) => {
        this.connected.set(false);
        this.ws = null;
        this.connecting = false;
        try {
          // eslint-disable-next-line no-console
          console.warn('[WS] closed', ev.code, ev.reason || '(no reason)');
        } catch {}
        // Si fermeture due à une auth invalide/bannie côté serveur, forcer logout immédiat
        if (ev.code === 4401 || ev.code === 4001 || ev.code === 4003) {
          this.forceLogout('expired');
          return;
        }
        if (!this.stopped) this.scheduleReconnect();
      };
    } catch (e) {
      this.connecting = false;
      this.lastError.set(String(e));
      this.scheduleReconnect();
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.connected.set(false);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.stopped) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.start();
    }, 1500);
  }

  private computeWsUrl(): string {
    // URL WS explicites selon l'URL du front:
    // - Dev (front sous dev.*):  wss://dev.api.melodyhue.com/ws
    // - Prod (front sans sous-domaine): wss://api.melodyhue.com/ws
    const isDevFront = location.hostname.startsWith('dev.');
    const wsUrlBase = isDevFront ? 'wss://dev.api.melodyhue.com/ws' : 'wss://api.melodyhue.com/ws';
    let wsUrl = wsUrlBase;

    // Ajouter le token si disponible pour fiabiliser l’auth WS entre sous-domaines
    try {
      const token = this.auth.getAccessToken();
      if (token) {
        const u2 = new URL(wsUrl);
        u2.searchParams.set('token', token);
        wsUrl = u2.toString();
      }
    } catch {}

    return wsUrl;
  }

  private handleMessage(raw: unknown): void {
    let msg: any = null;
    try {
      msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }
    const type = (msg?.type || msg?.event || msg?.action || '').toString().toLowerCase();
    const reason = (msg?.reason || msg?.status || '').toString().toLowerCase();
    const isForceLogout =
      type === 'force_logout' ||
      type === 'logout' ||
      type === 'ban' ||
      type === 'banned' ||
      reason.includes('banned') ||
      reason.includes('ban');
    if (isForceLogout) {
      this.forceLogout(
        reason.includes('banned') || type === 'ban' || type === 'banned' ? 'banned' : 'expired'
      );
    }
  }
}
