import { Component } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-private-layout',
  imports: [SidebarComponent, RouterOutlet, FooterComponent],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss',
})
export class PrivateLayoutComponent {}
