export interface LoginIn {
  readonly username_or_email: string;
  readonly password: string;
  readonly totp?: string | null;
}

export interface LoginStep1Out {
  readonly requires_2fa: boolean;
  readonly ticket?: string | null;
}

export interface Login2FAIn {
  readonly ticket: string;
  readonly totp: string;
}

export interface TokenPair {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly token_type?: string; // default bearer
}

export interface LoginTokensOut extends TokenPair {
  readonly requires_2fa?: boolean; // default false
  readonly ticket?: string | null;
  readonly role?: string; // default 'user'
  readonly user_id: string;
}

export interface RefreshIn {
  readonly refresh_token: string;
}

// État local stocké
export interface AuthState extends TokenPair {
  readonly createdAt: string;
  readonly session: 'persistent' | 'session';
  readonly role?: string;
  readonly user_id?: string;
}

// Register
export interface RegisterIn {
  readonly username: string; // 3..80
  readonly email: string; // email
  readonly password: string; // 8..128
}

// Forgot / Reset
export interface ForgotPwdIn {
  readonly email: string;
}

export interface ResetPwdIn {
  readonly token: string;
  readonly new_password: string; // >= 8
}

// 2FA
export interface TwoFASetupOut {
  readonly secret: string;
  readonly otpauth_url: string;
}

export interface TwoFAVerifyIn {
  readonly code: string;
}
