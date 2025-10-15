import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { getTestProviders } from '../../../../../test-helpers';

import { LogoutComponent } from './logout.component';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutComponent],
      providers: [...getTestProviders(), provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
