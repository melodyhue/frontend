export interface UserOut {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly created_at: string; // date-time
  readonly last_login_at: string | null;
  readonly avatar_url?: string | null;
  readonly role?: string; // optional backend-provided role: 'admin' | 'moderator' | 'user'
  readonly twofa_enabled?: boolean; // état 2FA exposé par l'API (/users/me)
  readonly two_factor_enabled?: boolean; // compat: anciens schémas potentiels
}

export interface UpdateUsernameIn {
  readonly username: string; // 3..80
}

export interface UpdateEmailIn {
  readonly email: string; // email
}

export interface ChangePasswordIn {
  readonly old_password: string;
  readonly new_password: string; // >= 8
}

export interface DeleteAccountIn {
  readonly password: string; // >= 8
}
