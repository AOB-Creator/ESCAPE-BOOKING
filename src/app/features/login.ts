import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '../core/state/auth.store';
import { formatPhone } from '../core/util/format';
import { Icon } from '../shared/icon';

type Step = 'phone' | 'code' | 'name';

@Component({
  selector: 'app-login',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page login">
      <header class="topbar">
        <button type="button" class="icon-btn" aria-label="Orqaga" (click)="back()">
          <app-icon name="chevron-left" [size]="22" />
        </button>
      </header>

      @switch (step()) {
        @case ('phone') {
          <form class="login__form" (ngSubmit)="sendCode()">
            <h1 class="h1">Telefon raqamingiz</h1>
            <p class="muted lead">Kirish uchun SMS kod yuboramiz</p>
            <label class="field">
              <span class="field__label">Telefon raqam</span>
              <span class="input input--prefix">
                <span class="input__prefix">+998</span>
                <input #phoneInput name="phone" type="tel" inputmode="numeric" autocomplete="tel-national"
                  placeholder="90 123 45 67" [ngModel]="phoneView()" (ngModelChange)="onPhone($event)"
                  aria-describedby="phone-error" required />
              </span>
            </label>
            <p id="phone-error" class="error" role="alert">{{ error() }}</p>
            <button type="submit" class="btn btn--primary btn--block" [disabled]="!phoneValid() || busy()">
              {{ busy() ? 'Yuborilmoqda…' : 'Kod olish' }}
            </button>
          </form>
        }
        @case ('code') {
          <form class="login__form" (ngSubmit)="verify()">
            <h1 class="h1">SMS kodni kiriting</h1>
            <p class="muted lead">{{ phoneFull() }} raqamiga kod yuborildi</p>
            <label class="field">
              <span class="field__label">Tasdiqlash kodi</span>
              <input #codeInput class="input input--code" name="code" type="text" inputmode="numeric"
                autocomplete="one-time-code" maxlength="4" placeholder="••••" [(ngModel)]="code"
                aria-describedby="code-hint code-error" required />
            </label>
            @if (demoCode()) {
              <p id="code-hint" class="hint">Demo rejim: kod {{ demoCode() }}</p>
            }
            <p id="code-error" class="error" role="alert">{{ error() }}</p>
            <button type="submit" class="btn btn--primary btn--block" [disabled]="code.length !== 4 || busy()">
              {{ busy() ? 'Tekshirilmoqda…' : 'Tasdiqlash' }}
            </button>
            <button type="button" class="btn btn--ghost btn--block" (click)="changePhone()">Raqamni o‘zgartirish</button>
          </form>
        }
        @case ('name') {
          <form class="login__form" (ngSubmit)="register()">
            <h1 class="h1">Ismingiz qanday?</h1>
            <p class="muted lead">Bronlar shu ismga rasmiylashtiriladi</p>
            <label class="field">
              <span class="field__label">Ism</span>
              <input #nameInput class="input" name="name" autocomplete="given-name" placeholder="Masalan, Aziz"
                [(ngModel)]="name" required />
            </label>
            <button type="submit" class="btn btn--primary btn--block" [disabled]="name.trim().length < 2 || busy()">
              Davom etish
            </button>
          </form>
        }
      }
    </main>
  `,
  styles: `
    .login { min-height: 100dvh; padding: calc(12px + env(safe-area-inset-top)) 20px 28px; }
    .login__form { display: flex; flex-direction: column; gap: 14px; margin-top: 28px; }
    .lead { margin: -6px 0 10px; }
    .input--code { text-align: center; letter-spacing: 0.5em; font-size: 22px; }
    .error:empty { display: none; }
    @media (min-width: 960px) {
      .login { min-height: auto; max-width: 460px; margin: 10vh auto 0; padding: 28px 32px 36px;
        background: var(--surface); border-radius: var(--r-sheet); }
      .login .icon-btn { background: var(--soft); }
    }
  `,
})
export class Login {
  private auth = inject(AuthStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private phoneInput = viewChild<ElementRef<HTMLInputElement>>('phoneInput');
  private codeInput = viewChild<ElementRef<HTMLInputElement>>('codeInput');
  private nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  protected step = signal<Step>('phone');
  protected digits = signal('');
  protected busy = signal(false);
  protected error = signal('');
  protected demoCode = signal<string | undefined>(undefined);
  protected code = '';
  protected name = '';

  protected phoneValid = computed(() => /^\d{9}$/.test(this.digits()));
  protected phoneFull = computed(() => formatPhone('998' + this.digits()));
  protected phoneView = computed(() => formatPhone('998' + this.digits()).replace('+998', '').trim());

  ngAfterViewInit() {
    this.phoneInput()?.nativeElement.focus();
  }

  onPhone(value: string) {
    this.digits.set(value.replace(/\D/g, '').replace(/^998(?=\d{9})/, '').slice(0, 9));
    this.error.set('');
  }

  async sendCode() {
    if (!this.phoneValid()) return this.error.set('Raqamni to‘liq kiriting');
    this.busy.set(true);
    const res = await this.auth.requestCode('+998' + this.digits());
    this.busy.set(false);
    this.demoCode.set(res.demoCode);
    this.error.set('');
    this.go('code', () => this.codeInput());
  }

  async verify() {
    this.busy.set(true);
    const res = await this.auth.verify('+998' + this.digits(), this.code);
    this.busy.set(false);
    if (!res.ok) return this.error.set('Kod noto‘g‘ri. Qayta urinib ko‘ring');
    if (res.needsName) return this.go('name', () => this.nameInput());
    this.finish();
  }

  async register() {
    this.busy.set(true);
    await this.auth.register('+998' + this.digits(), this.name);
    this.busy.set(false);
    this.finish();
  }

  changePhone() {
    this.code = '';
    this.error.set('');
    this.go('phone', () => this.phoneInput());
  }

  back() {
    if (this.step() === 'phone') this.router.navigateByUrl('/');
    else this.changePhone();
  }

  private go(step: Step, focus: () => ElementRef<HTMLInputElement> | undefined) {
    this.step.set(step);
    setTimeout(() => focus()?.nativeElement.focus());
  }

  private finish() {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    this.router.navigateByUrl(redirect && redirect.startsWith('/') ? redirect : '/home');
  }
}
