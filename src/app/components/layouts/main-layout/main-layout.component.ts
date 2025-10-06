import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from '../../shared/navigation/navigation.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {}
