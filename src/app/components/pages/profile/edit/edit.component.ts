import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LocaleService } from '../../../../core/services/locale.service';
import { md5 } from '../../../../core/utils/md5.util';
import { ButtonComponent } from '../../../shared/button/button.component';
import { UsersService } from '../../../../core/services/users.service';
import { SettingsService } from '../../../../core/services/settings.service';

type AvatarType = 'gravatar' | 'initials';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarType: AvatarType;
  avatarColor: string;
}

@Component({
  selector: 'app-edit',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly settingsService = inject(SettingsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly isSaving = signal<boolean>(false);
  readonly successMessage = signal<string>('');

  // User data
  user = signal<UserProfile>({
    id: '',
    username: '',
    email: '',
    avatarType: 'gravatar',
    avatarColor: '#0a3228',
  });
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  // Indique si les préférences d'avatar sont chargées depuis /settings/me
  readonly settingsLoading = signal<boolean>(true);

  // Gravatar state
  gravatarLoading = signal(false);
  gravatarAvailable = signal(false);
  currentEmail = signal('');

  // Available colors for initials
  avatarColors = ['#c97b7b', '#e3a76f', '#f0d58c', '#7aa06f', '#6d8faf', '#9c83c5', '#e9a1b1'];

  private normalizeHexColor(input: string | undefined | null, fallback: string): string {
    if (!input) return fallback;
    const v = String(input).trim();
    const hex = v.startsWith('#') ? v.slice(1) : v;
    return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : fallback;
  }

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    avatarType: ['gravatar' as AvatarType],
    avatarColor: ['#0a3228'],
  });

  readonly title = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Modifier le profil' : 'Edit Profile';
  });

  readonly labels = computed(() => {
    const locale = this.localeService.locale();
    return {
      username: locale === 'fr' ? "Nom d'utilisateur" : 'Username',
      email: locale === 'fr' ? 'Email' : 'Email',
      avatarSettings: locale === 'fr' ? "Paramètres de l'avatar" : 'Avatar Settings',
      useGravatar: locale === 'fr' ? 'Utiliser Gravatar' : 'Use Gravatar',
      useInitials: locale === 'fr' ? 'Utiliser les initiales' : 'Use Initials',
      gravatarNotAvailable:
        locale === 'fr'
          ? 'Aucun Gravatar trouvé pour cet email'
          : 'No Gravatar found for this email',
      createGravatar: locale === 'fr' ? 'Créer un compte Gravatar' : 'Create Gravatar Account',
      chooseColor:
        locale === 'fr' ? 'Choisir une couleur pour les initiales' : 'Choose a color for initials',
      cancel: locale === 'fr' ? 'Annuler' : 'Cancel',
      save: locale === 'fr' ? 'Enregistrer' : 'Save',
      saving: locale === 'fr' ? 'Enregistrement...' : 'Saving...',
      checking: locale === 'fr' ? 'Vérification...' : 'Checking...',
      usernameRequired:
        locale === 'fr' ? "Le nom d'utilisateur est requis" : 'Username is required',
      usernameMinLength:
        locale === 'fr'
          ? "Le nom d'utilisateur doit contenir au moins 3 caractères"
          : 'Username must be at least 3 characters',
      usernameMaxLength:
        locale === 'fr'
          ? "Le nom d'utilisateur ne peut pas dépasser 50 caractères"
          : 'Username cannot exceed 50 characters',
      emailRequired: locale === 'fr' ? "L'email est requis" : 'Email is required',
      emailInvalid: locale === 'fr' ? "L'email n'est pas valide" : 'Email is invalid',
    };
  });

  gravatarUrl = computed(() => {
    const email = (this.currentEmail() || '').toLowerCase().trim();
    if (!email) return '';
    const hash = md5(email).toLowerCase();
    return `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;
  });

  initials = computed(() => {
    const username = this.user().username.trim();
    if (!username) return '?';
    const parts = username.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  constructor() {
    // Charger l'utilisateur depuis l'API
    this.usersService.me().subscribe({
      next: (u) => {
        const prev = this.user();
        this.user.set({
          ...prev,
          id: u.id,
          username: u.username,
          email: u.email,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });

    // Charger les paramètres (avatar)
    this.settingsService.getSettings().subscribe({
      next: (s: any) => {
        const rawMode =
          typeof s?.avatar_mode === 'string' ? (s.avatar_mode as string).toLowerCase() : '';
        const mode = (rawMode === 'initials' ? 'initials' : 'gravatar') as AvatarType;
        const color = this.normalizeHexColor(
          typeof s?.avatar_color === 'string' ? (s.avatar_color as string) : '',
          this.avatarColors[0]
        );
        const current = this.user();
        this.user.set({ ...current, avatarType: mode, avatarColor: color });
        // Mettre à jour le formulaire avec les valeurs chargées
        this.form.patchValue({ avatarType: mode, avatarColor: color });
        this.settingsLoading.set(false);
      },
      error: () => {
        this.settingsLoading.set(false);
      },
    });
    // Load user data into form
    effect(() => {
      const user = this.user();
      this.form.patchValue({
        username: user.username,
        email: user.email,
        avatarType: user.avatarType,
        avatarColor: user.avatarColor,
      });
    });

    // Check Gravatar when email or avatar type changes
    effect(() => {
      const type = this.form.get('avatarType')?.value as AvatarType;
      const formEmail = (this.form.get('email')?.value as string | null | undefined) || '';
      const formValid = this.form.get('email')?.valid ?? false;
      const fallbackEmail = (this.user().email || '').trim();
      const emailToCheck = formValid ? formEmail : fallbackEmail;
      this.currentEmail.set(emailToCheck);
      if (type === 'gravatar' && emailToCheck) {
        // Reset availability while checking to avoid loading a possibly wrong image
        this.gravatarAvailable.set(false);
        this.checkGravatarAvailability(emailToCheck);
      } else {
        // Pas d'email ou email invalide ou type != gravatar => pas de gravatar
        this.gravatarAvailable.set(false);
      }
    });
  }

  async checkGravatarAvailability(email: string) {
    if (!this.isBrowser) {
      this.gravatarLoading.set(false);
      return;
    }
    this.gravatarLoading.set(true);
    // Désactiver l'image pendant la vérification
    this.gravatarAvailable.set(false);

    try {
      const hash = md5(email.toLowerCase().trim()).toLowerCase();
      const url = `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;

      // Utiliser une image pour contourner CORS
      const img = new Image();
      const expectedMode = this.form.get('avatarType')?.value as AvatarType;

      const checkPromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);

        // Timeout après 12 secondes (réduit les faux négatifs en réseau lent)
        setTimeout(() => resolve(false), 12000);
      });

      img.src = url;
      const isAvailable = await checkPromise;
      // Ne pas écraser si l'utilisateur a changé de préférence (initials) pendant le check
      if ((this.form.get('avatarType')?.value as AvatarType) !== expectedMode) {
        return;
      }
      this.gravatarAvailable.set(isAvailable);
    } catch {
      this.gravatarAvailable.set(false);
    } finally {
      this.gravatarLoading.set(false);
    }
  }

  setAvatarType(type: AvatarType) {
    // Si on passe de gravatar -> initials pour la première fois, imposer la 1ère couleur de la palette
    const prevType = (this.form.get('avatarType')?.value as AvatarType) || this.user().avatarType;
    if (type === 'initials') {
      const currentColor = this.form.get('avatarColor')?.value as string;
      const normalized = this.normalizeHexColor(currentColor, '');
      const needDefaultColor = prevType !== 'initials' || !normalized;
      this.form.patchValue({
        avatarType: type,
        avatarColor: needDefaultColor ? this.avatarColors[0] : normalized,
      });
    } else {
      this.form.patchValue({ avatarType: type });
    }
  }

  setAvatarColor(color: string) {
    this.form.patchValue({ avatarColor: color });
  }

  openGravatar() {
    window.open('https://gravatar.com', '_blank');
  }

  onSubmit(): void {
    if (!this.form.valid || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set('');

    const current = this.user();
    const formValue = this.form.value;
    const usernameChanged = !!formValue.username && formValue.username !== current.username;
    const emailChanged = !!formValue.email && formValue.email !== current.email;
    const avatarChanged =
      (formValue.avatarType as AvatarType) !== current.avatarType ||
      (formValue.avatarType === 'initials' && formValue.avatarColor !== current.avatarColor);

    const afterSuccess = () => {
      const locale = this.localeService.locale();
      this.successMessage.set(
        locale === 'fr' ? 'Profil mis à jour avec succès !' : 'Profile updated successfully!'
      );
      // Mettre à jour l'état local
      this.user.set({
        ...current,
        username: formValue.username || current.username,
        email: formValue.email || current.email,
        avatarType: (formValue.avatarType as AvatarType) || current.avatarType,
        avatarColor: formValue.avatarColor || current.avatarColor,
      });
      this.isSaving.set(false);
      setTimeout(() => this.successMessage.set(''), 5000);
    };

    const onError = () => {
      this.isSaving.set(false);
    };

    // Préparer payload des settings si l'avatar a changé
    const settingsPayload = (() => {
      const mode = formValue.avatarType as AvatarType;
      if (mode === 'gravatar') {
        return { avatar_mode: 'gravatar' } as const;
      }
      return { avatar_mode: 'initials', avatar_color: formValue.avatarColor } as const;
    })();

    // Chaîne séquentielle: username -> email -> settings si nécessaire
    const doUpdateUsername = () =>
      this.usersService.updateUsername({ username: formValue.username! }).subscribe({
        next: () =>
          emailChanged ? doUpdateEmail() : avatarChanged ? doUpdateSettings() : afterSuccess(),
        error: onError,
      });

    const doUpdateEmail = () =>
      this.usersService.updateEmail({ email: formValue.email! }).subscribe({
        next: () => (avatarChanged ? doUpdateSettings() : afterSuccess()),
        error: onError,
      });

    const doUpdateSettings = () =>
      this.settingsService.updateSettings(settingsPayload as any).subscribe({
        next: afterSuccess,
        error: onError,
      });

    if (usernameChanged) {
      doUpdateUsername();
    } else if (emailChanged) {
      doUpdateEmail();
    } else {
      if (avatarChanged) {
        doUpdateSettings();
      } else {
        // Rien à mettre à jour côté API, on rafraîchit juste l’état local (avatar prefs locales)
        afterSuccess();
      }
    }
  }

  cancel(): void {
    // Réinitialiser le formulaire aux valeurs initiales
    const user = this.user();
    this.form.patchValue({
      username: user.username,
      email: user.email,
      avatarType: user.avatarType,
      avatarColor: user.avatarColor,
    });
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.successMessage.set('');
  }

  getError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const labels = this.labels();
    if (control.errors['required']) {
      return fieldName === 'username' ? labels.usernameRequired : labels.emailRequired;
    }
    if (control.errors['minlength']) {
      return labels.usernameMinLength;
    }
    if (control.errors['maxlength']) {
      return labels.usernameMaxLength;
    }
    if (control.errors['email']) {
      return labels.emailInvalid;
    }
    return '';
  }
}
