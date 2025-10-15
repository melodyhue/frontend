import 'zone.js'; // Nécessaire pour Angular
import 'zone.js/testing'; // Nécessaire pour les tests Angular

import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Initialiser l'environnement de test Angular sans API dépréciées
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
