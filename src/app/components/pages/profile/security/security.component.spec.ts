import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SecurityComponent } from './security.component';

describe('SecurityComponent', () => {
  let component: SecurityComponent;
  let fixture: ComponentFixture<SecurityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
