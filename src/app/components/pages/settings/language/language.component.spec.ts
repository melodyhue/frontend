import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageComponent } from './language.component';

describe('SettingsLanguageComponent', () => {
  let component: LanguageComponent;
  let fixture: ComponentFixture<LanguageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle locale', () => {
    const initialLocale = component.localeService.locale();
    component.selectLocale(initialLocale === 'fr' ? 'en' : 'fr');
    expect(component.localeService.locale()).not.toBe(initialLocale);
  });
});
