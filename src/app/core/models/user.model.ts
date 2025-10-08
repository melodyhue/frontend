export interface UserOut {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly created_at: string; // date-time
  readonly last_login_at: string | null;
  readonly avatar_url?: string | null;
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
