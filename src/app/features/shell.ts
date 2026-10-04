import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon, IconName } from '../shared/icon';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <nav class="dock" aria-label="Asosiy menyu">
      <ul class="dock__bar">
        @for (item of items; track item.path) {
          <li>
            <a class="dock__item" [routerLink]="item.path" routerLinkActive="is-active"
              #rla="routerLinkActive" [attr.aria-label]="item.label"
              [attr.aria-current]="rla.isActive ? 'page' : null">
              <app-icon [name]="item.icon" [size]="22" />
              <span class="dock__label" aria-hidden="true">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>
      <a class="dock__round" routerLink="/bookings" routerLinkActive="is-active" #b="routerLinkActive"
        aria-label="Bronlarim" [attr.aria-current]="b.isActive ? 'page' : null">
        <app-icon name="luggage" [size]="22" />
      </a>
    </nav>
  `,
})
export class Shell {
  protected readonly items: NavItem[] = [
    { path: '/home', label: 'Asosiy', icon: 'home' },
    { path: '/favorites', label: 'Sevimlilar', icon: 'heart' },
    { path: '/bonuses', label: 'Bonuslar', icon: 'gift' },
    { path: '/profile', label: 'Profil', icon: 'user' },
  ];
}
