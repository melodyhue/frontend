import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTestProviders } from '../../../../test-helpers';
import { LocaleService } from '../../../core/services/locale.service';

import { NavigationComponent } from './navigation.component';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let documentRef: Document;
  let localeService: LocaleService;

  beforeEach(async () => {
    // Nettoyer le localStorage avant chaque test pour réinitialiser la locale
    window.localStorage.removeItem('melodyhue:locale');

    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [...getTestProviders(), provideZonelessChangeDetection()],
    }).compileComponents();

    documentRef = TestBed.inject(DOCUMENT);
    localeService = TestBed.inject(LocaleService);
    documentRef.documentElement.lang = 'fr';
    window.localStorage.removeItem('melodyhue:locale');
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use LocaleService for locale management', () => {
    expect(component.locale()).toBe(localeService.locale());
  });

  it('should default to French locale', () => {
    expect(component.locale()).toBe('fr');
    expect(documentRef.documentElement.lang).toBe('fr');
  });

  it('should switch locale to English and persist the preference', () => {
    component.selectLocale('en');
    fixture.detectChanges();

    expect(component.locale()).toBe('en');
    expect(documentRef.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem('melodyhue:locale')).toBe('en');
  });

  it('should render navigation links with localized labels', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    const primaryLabelsFr = Array.from(nativeElement.querySelectorAll('.main-links a'))
      .map((anchor) => anchor.textContent?.trim())
      .filter((label): label is string => Boolean(label));

    expect(primaryLabelsFr).toEqual(['Accueil', 'À propos']);

    component.selectLocale('en');
    fixture.detectChanges();

    const primaryLabelsEn = Array.from(nativeElement.querySelectorAll('.main-links a'))
      .map((anchor) => anchor.textContent?.trim())
      .filter((label): label is string => Boolean(label));

    expect(primaryLabelsEn).toEqual(['Home', 'About']);
  });

  it('should open and close the mobile menu', () => {
    component.toggleMenu();
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(component.isMenuOpen()).toBeTrue();
    expect(nativeElement.querySelector('.mobile-nav')).toBeTruthy();

    // Cliquer sur l'overlay pour fermer le menu
    const overlay = nativeElement.querySelector('.overlay') as HTMLDivElement;
    expect(overlay).toBeTruthy();
    overlay.click();
    fixture.detectChanges();

    expect(component.isMenuOpen()).toBeFalse();
    expect(nativeElement.querySelector('.mobile-nav')).toBeFalsy();
  });
});
