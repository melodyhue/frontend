import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../../../../test-helpers';

import { MinimalComponent } from './minimal.component';

describe('MinimalComponent', () => {
  let component: MinimalComponent;
  let fixture: ComponentFixture<MinimalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinimalComponent],
      providers: [...getTestProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(MinimalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
