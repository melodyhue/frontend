import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../../test-helpers';

import { CopyComponent } from './copy.component';

describe('CopyComponent', () => {
  let component: CopyComponent;
  let fixture: ComponentFixture<CopyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyComponent],
      providers: [...getTestProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(CopyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
