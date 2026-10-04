import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthStore } from './core/state/auth.store';
import { Shell } from './features/shell';
import { Welcome } from './features/welcome';

const signedIn: CanActivateFn = (_route, state) =>
  inject(AuthStore).isSignedIn() || inject(Router).createUrlTree(['/login'], { queryParams: { redirect: state.url } });

const signedOut: CanActivateFn = () => !inject(AuthStore).isSignedIn() || inject(Router).createUrlTree(['/home']);

export const routes: Routes = [
  { path: '', component: Welcome, title: 'Escape' },
  { path: 'login', canActivate: [signedOut], loadComponent: () => import('./features/login').then((m) => m.Login), title: 'Kirish · Escape' },
  {
    path: '',
    component: Shell,
    canActivate: [signedIn],
    children: [
      { path: 'home', loadComponent: () => import('./features/home').then((m) => m.Home), title: 'Asosiy · Escape' },
      { path: 'results', loadComponent: () => import('./features/results').then((m) => m.Results), title: 'Qidiruv · Escape' },
      { path: 'favorites', loadComponent: () => import('./features/favorites').then((m) => m.Favorites), title: 'Sevimlilar · Escape' },
      { path: 'bonuses', loadComponent: () => import('./features/bonuses').then((m) => m.Bonuses), title: 'Bonuslar · Escape' },
      { path: 'bookings', loadComponent: () => import('./features/bookings').then((m) => m.Bookings), title: 'Bronlarim · Escape' },
      { path: 'profile', loadComponent: () => import('./features/profile').then((m) => m.Profile), title: 'Profil · Escape' },
    ],
  },
  {
    path: 'hotel/:id',
    canActivate: [signedIn],
    loadComponent: () => import('./features/hotel-detail').then((m) => m.HotelDetail),
    title: 'Mehmonxona · Escape',
  },
  { path: '**', redirectTo: '' },
];
