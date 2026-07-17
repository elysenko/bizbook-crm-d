import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  adminOnly: boolean;
  primary: boolean; // appears in mobile bottom bar
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  readonly navItems: NavItem[] = [
    { label: 'Today', path: '/today', icon: '🗓️', adminOnly: false, primary: true },
    { label: 'Appointments', path: '/appointments', icon: '📅', adminOnly: false, primary: true },
    { label: 'Clients', path: '/clients', icon: '👥', adminOnly: true, primary: true },
    { label: 'Services', path: '/services', icon: '🧾', adminOnly: true, primary: true },
    { label: 'Revenue', path: '/revenue', icon: '💰', adminOnly: true, primary: true },
    { label: 'Settings', path: '/admin/settings', icon: '⚙️', adminOnly: true, primary: false },
  ];

  readonly drawerOpen = signal(false);

  readonly visibleItems = computed(() =>
    this.navItems.filter((i) => !i.adminOnly || this.auth.isAdmin()),
  );
  readonly primaryItems = computed(() => this.visibleItems().filter((i) => i.primary));

  constructor(public auth: AuthService) {}

  get initials(): string {
    const name = this.auth.user()?.name ?? 'Guest';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  logout(): void {
    this.closeDrawer();
    this.auth.logout();
  }
}
