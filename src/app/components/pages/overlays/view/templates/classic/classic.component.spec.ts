import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassicComponent } from './classic.component';

describe('ClassicComponent', () => {
  let component: ClassicComponent;
  let fixture: ComponentFixture<ClassicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
