import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../../test-helpers';

import { CreateComponent } from './create.component';

describe('CreateComponent', () => {
  let component: CreateComponent;
  let fixture: ComponentFixture<CreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateComponent],
      providers: [...getTestProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
