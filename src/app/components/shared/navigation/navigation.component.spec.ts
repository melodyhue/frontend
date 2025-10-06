import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NavigationComponent } from './navigation.component';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let documentRef: Document;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [provideRouter([]), provideZonelessChangeDetection()],
    }).compileComponents();

    documentRef = TestBed.inject(DOCUMENT);
    documentRef.documentElement.lang = 'fr';
    window.localStorage.removeItem('melodyhue:locale');
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

    const closeButton = nativeElement.querySelector('.mobile-nav__close') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    expect(component.isMenuOpen()).toBeFalse();
    expect(nativeElement.querySelector('.mobile-nav')).toBeFalsy();
  });
});
