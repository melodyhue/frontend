import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProvidersWithRoute } from '../../../../../../test-helpers';

import { ViewUserComponent } from './view-user.component';

describe('ViewUserComponent', () => {
  let component: ViewUserComponent;
  let fixture: ComponentFixture<ViewUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewUserComponent],
      providers: [...getTestProvidersWithRoute()],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
