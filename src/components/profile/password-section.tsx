'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import type { ChangePasswordValuesOfUser } from '@/types/user';

const upperCaseRegex = /[A-Z]/;
const lowerCaseRegex = /[a-z]/;
const numberRegex = /[0-9]/;

export default function PasswordSection({
  onSuccess,
  onCancel,
  className = '',
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}) {
  const [values, setValues] = useState<ChangePasswordValuesOfUser>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCancel = () => {
    setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    onCancel?.();
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!upperCaseRegex.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!lowerCaseRegex.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!numberRegex.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const validateForm = (): boolean => {
    if (
      !(values.currentPassword && values.newPassword && values.confirmPassword)
    ) {
      setError('Please fill all fields.');
      return false;
    }

    if (values.newPassword !== values.confirmPassword) {
      setError('New password and confirmation do not match.');
      return false;
    }

    if (values.currentPassword === values.newPassword) {
      setError('New password must be different from current password.');
      return false;
    }

    const passwordError = validatePassword(values.newPassword);
    if (passwordError) {
      setError(passwordError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });

      if (response.error) {
        const errorMessage =
          response.error.message || 'Failed to change password';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (response.data) {
        toast.success('Password changed successfully');
        setValues({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        onSuccess?.();
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to change password';

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVisibility = (field: 'current' | 'next' | 'confirm') => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <form className={`grid gap-4 ${className}`} onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label className="flex items-center gap-2" htmlFor="currentPassword">
          <Lock aria-hidden className="h-4 w-4" />
          Current password
        </Label>
        <div className="relative">
          <Input
            autoComplete="current-password"
            disabled={isSubmitting}
            id="currentPassword"
            name="currentPassword"
            onChange={handleChange}
            placeholder="••••••••"
            type={show.current ? 'text' : 'password'}
            value={values.currentPassword}
          />
          <button
            aria-label={show.current ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground"
            disabled={isSubmitting}
            onClick={() => toggleVisibility('current')}
            type="button"
          >
            {show.current ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <div className="relative">
          <Input
            autoComplete="new-password"
            disabled={isSubmitting}
            id="newPassword"
            name="newPassword"
            onChange={handleChange}
            placeholder="At least 8 characters"
            type={show.next ? 'text' : 'password'}
            value={values.newPassword}
          />
          <button
            aria-label={show.next ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground"
            disabled={isSubmitting}
            onClick={() => toggleVisibility('next')}
            type="button"
          >
            {show.next ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          Must contain 8+ characters, uppercase, lowercase, and number
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <div className="relative">
          <Input
            autoComplete="new-password"
            disabled={isSubmitting}
            id="confirmPassword"
            name="confirmPassword"
            onChange={handleChange}
            placeholder="Repeat new password"
            type={show.confirm ? 'text' : 'password'}
            value={values.confirmPassword}
          />
          <button
            aria-label={show.confirm ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground"
            disabled={isSubmitting}
            onClick={() => toggleVisibility('confirm')}
            type="button"
          >
            {show.confirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          disabled={isSubmitting}
          onClick={handleCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit" variant="destructive">
          {isSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Changing...
            </>
          ) : (
            'Change Password'
          )}
        </Button>
      </div>
    </form>
  );
}
