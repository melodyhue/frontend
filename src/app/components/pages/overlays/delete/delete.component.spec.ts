import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../../test-helpers';

import { DeleteComponent } from './delete.component';

describe('DeleteComponent', () => {
  let component: DeleteComponent;
  let fixture: ComponentFixture<DeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteComponent],
      providers: [...getTestProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
