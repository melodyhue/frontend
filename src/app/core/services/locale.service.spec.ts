import { TestBed } from '@angular/core/testing';
import { LocaleService } from './locale.service';

describe('LocaleService', () => {
  let service: LocaleService;

  beforeEach(() => {
    window.localStorage.removeItem('melodyhue:locale');
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to French locale', () => {
    expect(service.locale()).toBe('fr');
  });

  it('should toggle between locales', () => {
    expect(service.locale()).toBe('fr');
    service.toggleLocale();
    expect(service.locale()).toBe('en');
    service.toggleLocale();
    expect(service.locale()).toBe('fr');
  });

  it('should select a specific locale', () => {
    service.selectLocale('en');
    expect(service.locale()).toBe('en');
    expect(window.localStorage.getItem('melodyhue:locale')).toBe('en');
  });

  it('should not change locale if already selected', () => {
    const initialLocale = service.locale();
    service.selectLocale(initialLocale);
    expect(service.locale()).toBe(initialLocale);
  });
});
