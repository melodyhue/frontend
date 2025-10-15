import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { getTestProviders } from '../../../../../test-helpers';

import { GeneralComponent } from './general.component';

describe('GeneralComponent', () => {
  let component: GeneralComponent;
  let fixture: ComponentFixture<GeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralComponent],
      providers: [...getTestProviders(), provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
