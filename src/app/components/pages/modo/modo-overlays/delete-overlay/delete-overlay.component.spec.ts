import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteOverlayComponent } from './delete-overlay.component';

describe('DeleteOverlayComponent', () => {
  let component: DeleteOverlayComponent;
  let fixture: ComponentFixture<DeleteOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
