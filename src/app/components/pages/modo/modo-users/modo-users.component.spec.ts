import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../../test-helpers';

import { ModoUsersComponent } from './modo-users.component';

describe('ModoUsersComponent', () => {
  let component: ModoUsersComponent;
  let fixture: ComponentFixture<ModoUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModoUsersComponent],
      providers: [...getTestProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(ModoUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
