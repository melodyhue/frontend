import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-security',
  imports: [ReactiveFormsModule],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isSaving = signal<boolean>(false);
  readonly successMessage = signal<string>('');
  readonly twoFactorEnabled = signal<boolean>(false);
  readonly showCurrentPassword = signal<boolean>(false);
  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator,
    }
  );

  readonly title = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Sécurité' : 'Security';
  });

  readonly labels = computed(() => {
    const locale = this.localeService.locale();
    return {
      changePassword: locale === 'fr' ? 'Changer le mot de passe' : 'Change Password',
      currentPassword: locale === 'fr' ? 'Mot de passe actuel' : 'Current Password',
      newPassword: locale === 'fr' ? 'Nouveau mot de passe' : 'New Password',
      confirmPassword: locale === 'fr' ? 'Confirmer le mot de passe' : 'Confirm Password',
      twoFactor:
        locale === 'fr'
          ? 'Authentification à deux facteurs (2FA)'
          : 'Two-Factor Authentication (2FA)',
      twoFactorDesc:
        locale === 'fr'
          ? 'Ajoutez une couche de sécurité supplémentaire à votre compte'
          : 'Add an extra layer of security to your account',
      enable2FA: locale === 'fr' ? 'Activer 2FA' : 'Enable 2FA',
      disable2FA: locale === 'fr' ? 'Désactiver 2FA' : 'Disable 2FA',
      enabled: locale === 'fr' ? 'Activé' : 'Enabled',
      disabled: locale === 'fr' ? 'Désactivé' : 'Disabled',
      cancel: locale === 'fr' ? 'Réinitialiser' : 'Reset',
      save: locale === 'fr' ? 'Enregistrer' : 'Save',
      saving: locale === 'fr' ? 'Enregistrement...' : 'Saving...',
      show: locale === 'fr' ? 'Afficher' : 'Show',
      hide: locale === 'fr' ? 'Masquer' : 'Hide',
      passwordRequired: locale === 'fr' ? 'Le mot de passe est requis' : 'Password is required',
      passwordMinLength:
        locale === 'fr'
          ? 'Le mot de passe doit contenir au moins 8 caractères'
          : 'Password must be at least 8 characters',
      passwordsMustMatch:
        locale === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords must match',
      comingSoon: locale === 'fr' ? 'Bientôt disponible' : 'Coming Soon',
    };
  });

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmitPassword(): void {
    if (this.passwordForm.valid) {
      this.isSaving.set(true);
      this.successMessage.set('');

      // Simuler l'enregistrement
      setTimeout(() => {
        this.isSaving.set(false);
        const locale = this.localeService.locale();
        this.successMessage.set(
          locale === 'fr' ? 'Mot de passe modifié avec succès !' : 'Password changed successfully!'
        );

        // Réinitialiser le formulaire
        this.passwordForm.reset();

        // Effacer le message après 5 secondes
        setTimeout(() => {
          this.successMessage.set('');
        }, 5000);
      }, 1000);
    }
  }

  toggle2FA(): void {
    // TODO: Implémenter la logique 2FA
    this.twoFactorEnabled.update((v) => !v);
  }

  cancel(): void {
    // Réinitialiser le formulaire de mot de passe
    this.passwordForm.reset();
    this.passwordForm.markAsUntouched();
    this.passwordForm.markAsPristine();
    this.successMessage.set('');

    // Réinitialiser la visibilité des mots de passe
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  getPasswordError(fieldName: string): string {
    const control = this.passwordForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const labels = this.labels();
    if (control.errors['required']) {
      return labels.passwordRequired;
    }
    if (control.errors['minlength']) {
      return labels.passwordMinLength;
    }

    // Check for password mismatch on confirmPassword field
    if (fieldName === 'confirmPassword' && this.passwordForm.errors?.['passwordMismatch']) {
      return labels.passwordsMustMatch;
    }

    return '';
  }

  getPasswordStrength(): number {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
  }

  getPasswordStrengthLabel(): string {
    const strength = this.getPasswordStrength();
    const locale = this.localeService.locale();

    if (strength <= 2) {
      return locale === 'fr' ? 'Faible' : 'Weak';
    } else if (strength <= 3) {
      return locale === 'fr' ? 'Moyen' : 'Medium';
    } else {
      return locale === 'fr' ? 'Fort' : 'Strong';
    }
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.showCurrentPassword.update((v) => !v);
    } else if (field === 'new') {
      this.showNewPassword.update((v) => !v);
    } else {
      this.showConfirmPassword.update((v) => !v);
    }
  }
}
