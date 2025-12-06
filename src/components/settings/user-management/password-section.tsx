'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
// import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import type {
  ChangePasswordFormProps,
  ChangePasswordValues,
} from '@/types/user';
// import { generateInvitationEmailHTML, sendEmail } from '@/lib/email';
import { decryptId } from '@/utils/aes-security-encryption';

export default function PasswordSection({
  onCancel,
  className = '',
  userId,
}: ChangePasswordFormProps) {
  const [values, setValues] = useState<ChangePasswordValues>({
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({
    next: false,
    confirm: false,
  });
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCancel = () => {
    setValues({ newPassword: '', confirmPassword: '' });
    setError('');
    onCancel?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(values.newPassword && values.confirmPassword)) {
      setError('Please fill all fields.');
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    const { data, error: ChangeError } = await authClient.admin.setUserPassword(
      {
        newPassword: values.newPassword,
        userId: decryptId(userId),
      }
    );

    if (ChangeError) {
      setError(ChangeError.message ?? 'Failed to change password');
      return;
    }
    if (data.status) {
      // const loginUrl = `${window.location.origin}/`;

      // const emailHTML = generateInvitationEmailHTML({
      //   userName: `${values.firstName} ${values.lastName}`,
      //   email: values.email,
      //   temporaryPassword: values.newPassword,
      //   loginUrl,
      // });

      // const emailResult = await sendEmail({
      //   to: values.email,
      //   subject: 'Welcome to PBS Project Management - Password Reset',
      //   html: emailHTML,
      // });
      // if (emailResult.success) {
      //   listUsers(currentPage, pageSize, query);
      //   toast.success(
      //     `User ${values.firstName} ${values.lastName} has been created and invitation email sent!`,
      //     { id: loadingToast }
      //   );
      // } else {
      //   toast.warning(
      //     'User password changed successfully, but invitation email failed to send. Please contact the user manually.'
      //   );
      // }
      setValues({ newPassword: '', confirmPassword: '' });
    }
    // else {
    //   toast.error('Failed to change password. Please try again.');
    // }
  };

  return (
    <form className={`grid gap-4 ${className}`} onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label className="flex items-center gap-2" htmlFor="newPassword">
          <Lock aria-hidden className="h-4 w-4" />
          New password
        </Label>
        <div className="relative">
          <Input
            autoComplete="new-password"
            name="newPassword"
            onChange={handleChange}
            placeholder="At least 8 characters"
            type={show.next ? 'text' : 'password'}
            value={values.newPassword}
          />
          <button
            aria-label={show.next ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 my-auto text-muted-foreground"
            onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
            type="button"
          >
            {show.next ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <div className="relative">
          <Input
            autoComplete="new-password"
            name="confirmPassword"
            onChange={handleChange}
            placeholder="Repeat new password"
            type={show.confirm ? 'text' : 'password'}
            value={values.confirmPassword}
          />
          <button
            aria-label={show.confirm ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 my-auto text-muted-foreground"
            onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
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
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button onClick={handleCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" variant={'destructive'}>
          Save & send email
        </Button>
      </div>
    </form>
  );
}
