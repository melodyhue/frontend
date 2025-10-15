import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { getTestProviders } from '../../../../test-helpers';

import { PrivateLayoutComponent } from './private-layout.component';

describe('PrivateLayoutComponent', () => {
  let component: PrivateLayoutComponent;
  let fixture: ComponentFixture<PrivateLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateLayoutComponent],
      providers: [...getTestProviders(), provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivateLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
