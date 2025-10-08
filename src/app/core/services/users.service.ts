import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  UserOut,
  UpdateEmailIn,
  UpdateUsernameIn,
  ChangePasswordIn,
  DeleteAccountIn,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  me() {
    return this.http.get<UserOut>('users/me');
  }

  updateUsername(payload: UpdateUsernameIn) {
    return this.http.patch<UserOut>('users/me/username', payload);
  }

  updateEmail(payload: UpdateEmailIn) {
    return this.http.patch<UserOut>('users/me/email', payload);
  }

  changePassword(payload: ChangePasswordIn) {
    return this.http.post<void>('users/me/password', payload);
  }

  deleteAccount(payload: DeleteAccountIn) {
    return this.http.delete<void>('users/me', { body: payload });
  }
}
