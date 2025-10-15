import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProvidersWithRoute } from '../../../../../../test-helpers';

import { WarnUserComponent } from './warn-user.component';

describe('WarnUserComponent', () => {
  let component: WarnUserComponent;
  let fixture: ComponentFixture<WarnUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarnUserComponent],
      providers: [...getTestProvidersWithRoute()],
    }).compileComponents();

    fixture = TestBed.createComponent(WarnUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
