import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LocaleService } from '../../../../core/services/locale.service';
import { md5 } from '../../../../core/utils/md5.util';

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
  imports: [ReactiveFormsModule],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isSaving = signal<boolean>(false);
  readonly successMessage = signal<string>('');

  // User data
  user = signal<UserProfile>({
    id: '1',
    username: 'Laxe4k',
    email: 'Laxe4k@hotmail.com',
    avatarType: 'gravatar',
    avatarColor: '#0a3228',
  });

  // Gravatar state
  gravatarLoading = signal(false);
  gravatarAvailable = signal(true);

  // Available colors for initials
  avatarColors = [
    '#0a3228',
    '#6df0cf',
    '#d2faf0',
    '#1a5c4d',
    '#2d7a6b',
    '#409788',
    '#ff6b6b',
    '#4ecdc4',
    '#45b7d1',
    '#f9ca24',
    '#6c5ce7',
    '#a29bfe',
  ];

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
      cancel: locale === 'fr' ? 'Réinitialiser' : 'Reset',
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
    const email = this.user().email.toLowerCase().trim();
    const hash = md5(email);
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
    // Load user data into form
    effect(
      () => {
        const user = this.user();
        this.form.patchValue({
          username: user.username,
          email: user.email,
          avatarType: user.avatarType,
          avatarColor: user.avatarColor,
        });
      },
      { allowSignalWrites: true }
    );

    // Check Gravatar when email changes
    effect(
      () => {
        const email = this.form.get('email')?.value;
        if (email && this.form.get('email')?.valid) {
          this.checkGravatarAvailability(email);
        }
      },
      { allowSignalWrites: true }
    );
  }

  async checkGravatarAvailability(email: string) {
    this.gravatarLoading.set(true);

    try {
      const hash = md5(email.toLowerCase().trim());
      const url = `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;

      // Utiliser une image pour contourner CORS
      const img = new Image();

      const checkPromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);

        // Timeout après 5 secondes
        setTimeout(() => resolve(false), 5000);
      });

      img.src = url;
      const isAvailable = await checkPromise;
      this.gravatarAvailable.set(isAvailable);
    } catch {
      this.gravatarAvailable.set(false);
    } finally {
      this.gravatarLoading.set(false);
    }
  }

  setAvatarType(type: AvatarType) {
    this.form.patchValue({ avatarType: type });
  }

  setAvatarColor(color: string) {
    this.form.patchValue({ avatarColor: color });
  }

  openGravatar() {
    window.open('https://gravatar.com', '_blank');
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isSaving.set(true);
      this.successMessage.set('');

      // Simuler l'enregistrement
      setTimeout(() => {
        this.isSaving.set(false);
        const locale = this.localeService.locale();
        this.successMessage.set(
          locale === 'fr' ? 'Profil mis à jour avec succès !' : 'Profile updated successfully!'
        );

        // Mettre à jour les données utilisateur avec les nouvelles valeurs
        const formValue = this.form.value;
        this.user.set({
          ...this.user(),
          username: formValue.username || this.user().username,
          email: formValue.email || this.user().email,
          avatarType: (formValue.avatarType as AvatarType) || this.user().avatarType,
          avatarColor: formValue.avatarColor || this.user().avatarColor,
        });

        // Effacer le message après 5 secondes
        setTimeout(() => {
          this.successMessage.set('');
        }, 5000);
      }, 1000);
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
