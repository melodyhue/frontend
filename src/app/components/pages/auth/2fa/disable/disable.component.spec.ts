import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisableComponent } from './disable.component';

describe('DisableComponent', () => {
  let component: DisableComponent;
  let fixture: ComponentFixture<DisableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
