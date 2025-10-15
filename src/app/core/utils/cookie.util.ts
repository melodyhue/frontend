export type SameSite = 'Lax' | 'Strict' | 'None';

export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAgeSeconds?: number; // max-age
  expires?: Date; // alternative to max-age
  secure?: boolean; // true to add Secure
  sameSite?: SameSite;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  let c = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options.maxAgeSeconds && options.maxAgeSeconds > 0) {
    c += `; Max-Age=${Math.floor(options.maxAgeSeconds)}`;
  } else if (options.expires instanceof Date) {
    c += `; Expires=${options.expires.toUTCString()}`;
  }
  c += `; Path=${options.path || '/'}`;
  if (options.domain) c += `; Domain=${options.domain}`;
  if (options.secure) c += `; Secure`;
  if (options.sameSite) c += `; SameSite=${options.sameSite}`;
  document.cookie = c;
}

export function getCookie(name: string): string | null {
  const n = encodeURIComponent(name) + '=';
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(n)) {
      return decodeURIComponent(trimmed.substring(n.length));
    }
  }
  return null;
}

export function deleteCookie(name: string, options: CookieOptions = {}) {
  setCookie(name, '', {
    ...options,
    maxAgeSeconds: 0,
    expires: new Date(0),
  });
}
