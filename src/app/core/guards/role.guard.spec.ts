import { adminOnlyCanMatch, moderatorOrAdminCanMatch, resetRoleCache } from './role.guard';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsersService } from '../services/users.service';
import { PLATFORM_ID } from '@angular/core';
import { getTestProviders } from '../../../test-helpers';

describe('role.guard', () => {
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    resetRoleCache(); // Réinitialiser le cache avant chaque test
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['me']);
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);
    routerSpy.parseUrl.and.callFake((p: string) => ({} as any));

    TestBed.configureTestingModule({
      providers: [
        ...getTestProviders(),
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  it('adminOnlyCanMatch allows when backend returns admin', async () => {
    usersServiceSpy.me.and.returnValue(of({ role: 'admin' } as any));
    const res = await TestBed.runInInjectionContext(async () => adminOnlyCanMatch());
    expect(res).toBeTrue();
  });

  it('moderatorOrAdminCanMatch allows when backend returns moderator', async () => {
    usersServiceSpy.me.and.returnValue(of({ role: 'moderator' } as any));
    const res = await TestBed.runInInjectionContext(async () => moderatorOrAdminCanMatch());
    expect(res).toBeTrue();
  });

  it('denies when backend returns user', async () => {
    usersServiceSpy.me.and.returnValue(of({ role: 'user' } as any));
    const res = await TestBed.runInInjectionContext(async () => adminOnlyCanMatch());
    expect(res).not.toBeTrue();
    expect(routerSpy.parseUrl).toHaveBeenCalled();
  });

  it('denies when backend call fails', async () => {
    usersServiceSpy.me.and.returnValue(throwError(() => new Error('fail')));
    const res = await TestBed.runInInjectionContext(async () => moderatorOrAdminCanMatch());
    expect(res).not.toBeTrue();
    expect(routerSpy.parseUrl).toHaveBeenCalled();
  });
});
