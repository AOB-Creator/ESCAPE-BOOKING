import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PHOTOS } from '../core/data/mock-data';
import { AuthStore } from '../core/state/auth.store';

@Component({
  selector: 'app-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page welcome">
      <p class="logo" aria-label="Escape">ESCAPE<span class="logo__dot" aria-hidden="true"></span></p>

      <div class="orbit" aria-hidden="true">
        <div class="orbit__ring"></div>
        @for (src of tiles; track src; let i = $index) {
          <img class="orbit__tile" [src]="src" alt=""
            [style.--a]="i * (360 / tiles.length) - 90 + 'deg'"
            [style.--r]="(i % 2 ? -10 : 8) + 'deg'" />
        }
        <img class="orbit__center" [src]="center" alt="" />
      </div>

      <div class="welcome__side">
      <div class="welcome__copy">
        <p class="muted">Toshkentdan Chimyongacha</p>
        <h1 class="display">Dam olish uchun joy — bir necha bosishda</h1>
      </div>

      <button type="button" class="btn btn--primary btn--block" (click)="start()">Boshlash</button>
      </div>
    </main>
  `,
  styles: `
    .welcome { --orbit: min(330px, 84vw); min-height: 100dvh; display: flex; flex-direction: column; align-items: center;
      padding: calc(28px + env(safe-area-inset-top)) 20px calc(28px + env(safe-area-inset-bottom)); text-align: center; }
    .orbit { position: relative; width: var(--orbit); aspect-ratio: 1; margin: 28px auto 8px; flex-shrink: 0; }
    .orbit__ring { position: absolute; inset: 22%; border-radius: 50%; background: var(--surface); }
    .orbit__tile { --size: 15%; position: absolute; left: 50%; top: 50%; width: var(--size); aspect-ratio: 1;
      object-fit: cover; border-radius: 14px; background: var(--soft); margin: calc(var(--size) / -2);
      transform: rotate(var(--a)) translate(calc(var(--orbit) * 0.42)) rotate(calc(var(--a) * -1)) rotate(var(--r)); }
    .orbit__center { position: absolute; left: 50%; top: 50%; width: 32%; aspect-ratio: 1; object-fit: cover;
      border-radius: 22px; transform: translate(-50%, -50%); background: var(--soft); }
    .welcome__side { margin-top: auto; width: 100%; }
    .welcome__copy { margin: 0 0 28px; }
    .welcome__copy .muted { margin: 0 0 10px; font-size: 15px; }
    .display { font-size: clamp(32px, 9.5vw, 40px); line-height: 1.08; letter-spacing: -0.035em; font-weight: 500; margin: 0; }
    @media (min-width: 960px) {
      .welcome { --orbit: min(500px, 40vw); display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr;
        align-items: center; column-gap: 64px; max-width: 1200px; margin: 0 auto; padding: 32px 48px; text-align: left; }
      .logo { grid-column: 1 / -1; justify-self: start; }
      .orbit { margin: 0 auto; }
      .welcome__side { margin: 0; max-width: 460px; }
      .display { font-size: 56px; }
      .welcome__side .btn { width: auto; padding: 0 40px; }
    }
  `,
})
export class Welcome {
  private router = inject(Router);
  private auth = inject(AuthStore);
  protected readonly tiles = [
    PHOTOS.travel1, PHOTOS.travel2, PHOTOS.travel3, PHOTOS.travel4, PHOTOS.travel5,
    PHOTOS.travel6, PHOTOS.travel7, PHOTOS.travel8, PHOTOS.travel9, PHOTOS.travel10,
  ];
  protected readonly center = PHOTOS.welcome;

  start() {
    this.router.navigateByUrl(this.auth.isSignedIn() ? '/home' : '/login');
  }
}
