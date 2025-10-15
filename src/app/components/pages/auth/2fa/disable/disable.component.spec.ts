import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../../../test-helpers';

import { DisableComponent } from './disable.component';

describe('DisableComponent', () => {
  let component: DisableComponent;
  let fixture: ComponentFixture<DisableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisableComponent],
      providers: [...getTestProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(DisableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
