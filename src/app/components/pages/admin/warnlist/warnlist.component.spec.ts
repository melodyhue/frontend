import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../../test-helpers';

import { WarnlistComponent } from './warnlist.component';

describe('WarnlistComponent', () => {
  let component: WarnlistComponent;
  let fixture: ComponentFixture<WarnlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarnlistComponent],
      providers: [...getTestProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(WarnlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
