import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../../../test-helpers';

import { ColorComponent } from './color.component';

describe('ColorComponent', () => {
  let component: ColorComponent;
  let fixture: ComponentFixture<ColorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorComponent],
      providers: [...getTestProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
