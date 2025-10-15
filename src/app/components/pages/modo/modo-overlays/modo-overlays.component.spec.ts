import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModoOverlaysComponent } from './modo-overlays.component';

describe('ModoOverlaysComponent', () => {
  let component: ModoOverlaysComponent;
  let fixture: ComponentFixture<ModoOverlaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModoOverlaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModoOverlaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
