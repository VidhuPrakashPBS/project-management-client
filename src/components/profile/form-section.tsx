'use client';

import { LogOut, Mail, Phone, User2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { ProfileDetailsWithoutRole } from '@/types/user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import ChangePasswordForm from './password-section';

export default function FormSection({
  onSave,
  onCancel,
  className = '',
}: {
  onSave?: (values: ProfileDetailsWithoutRole) => void;
  onCancel?: () => void;
  className?: string;
}) {
  const [values, setValues] = useState<ProfileDetailsWithoutRole>({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [initialValues, setInitialValues] = useState<ProfileDetailsWithoutRole>(
    {
      name: '',
      email: '',
      phoneNumber: '',
    }
  );
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  // Fetch current user data
  useEffect(() => {
    const getUserSession = async () => {
      const sessionResponse = await authClient.getSession();

      if (!sessionResponse?.data?.user?.id) {
        toast.error('Not authenticated');
        window.location.href = '/login';
        return null;
      }

      return sessionResponse.data.user.id;
    };

    const fetchUserData = async (currentUserId: string) => {
      const { data: result } = await api.get(`/api/user/${currentUserId}`);

      if (!(result.success && result.data)) {
        toast.error(result.message || 'Failed to load user data');
        return null;
      }

      return result.data.data[0];
    };

    const mapToUserData = (user: {
      name?: string;
      email?: string;
      phoneNumber?: string;
    }): ProfileDetailsWithoutRole => ({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
    });

    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);

        const currentUserId = await getUserSession();
        if (!currentUserId) {
          return;
        }

        setUserId(currentUserId);

        const user = await fetchUserData(currentUserId);
        if (!user) {
          return;
        }

        const userData = mapToUserData(user);
        setValues(userData);
        setInitialValues(userData);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load user data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const isDirty = useMemo(() => {
    return (
      values.name !== initialValues.name ||
      values.email !== initialValues.email ||
      values.phoneNumber !== initialValues.phoneNumber
    );
  }, [values, initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setValues(initialValues);
    onCancel?.();
  };

  const handleEmailChange = async (newEmail: string) => {
    try {
      await authClient.changeEmail({ newEmail });
      toast.success(
        'Verification email sent. Please check your inbox to confirm the email change.'
      );
      return true;
    } catch (emailError) {
      toast.error(
        emailError instanceof Error
          ? emailError.message
          : 'Failed to change email'
      );
      return false;
    }
  };

  /**
   * Update user profile with the given data
   * @param {Partial<{name: string; phoneNumber: string;}>} updateData - Data to update the user profile with
   * @returns {Promise<boolean>} - True if the update was successful, false otherwise
   */
  const handleProfileUpdate = async (
    updateData: Partial<{
      name: string;
      phoneNumber: string;
    }>
  ) => {
    if (Object.keys(updateData).length === 0) {
      return false;
    }

    // Update via API
    await api.put(`/api/user/${userId}`, updateData);

    // Also update via Better Auth for consistency
    await authClient.updateUser(updateData);
    return true;
  };

  /**
   * Builds an object containing the differences between the current and initial values of the user profile.
   * The resulting object can be used to update the user profile with the changed values.
   * @returns {Partial<{name: string; phoneNumber: string;}>} - Object containing the differences between the current and initial values of the user profile.
   */
  const buildUpdateData = () => {
    const updateData: Partial<{
      name: string;
      phoneNumber: string;
    }> = {};

    if (values.name !== initialValues.name) {
      updateData.name = values.name;
    }

    if (values.phoneNumber !== initialValues.phoneNumber) {
      updateData.phoneNumber = values.phoneNumber;
    }

    return updateData;
  };

  /**
   * Submits the profile form.
   * Validates the submission, handles email changes, creates a FormData object, sends a multipart/form-data request to the API to update the user profile,
   * and handles the response. If the response is successful, it resets the form and fetches new activities.
   * If there is an error other than a ZodError, it returns a 500 Internal Server Error response with the error message.
   * @param {React.FormEvent} e - The form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      toast.info('No changes to save');
      return;
    }

    setIsSubmitting(true);

    try {
      const emailChanged = values.email !== initialValues.email;

      if (emailChanged) {
        await handleEmailChange(values.email);
      }

      const updateData = buildUpdateData();
      const wasUpdated = await handleProfileUpdate(updateData);

      if (wasUpdated && !emailChanged) {
        toast.success('Profile updated successfully');
      }

      setInitialValues(values);
      onSave?.(values);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsRevokingSessions(true);

    try {
      const response = await authClient.revokeSessions();

      if (response.error) {
        toast.error(
          response.error.message || 'Failed to logout from all devices'
        );
        return;
      }

      toast.success('Successfully logged out from all devices');

      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to logout from all devices'
      );
    } finally {
      setIsRevokingSessions(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`grid w-full gap-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid w-full gap-6 ${className}`}>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <h3 className="font-medium text-muted-foreground text-sm">
            Profile details
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User2 className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  autoComplete="name"
                  className="pl-9"
                  disabled={isSubmitting}
                  id="name"
                  name="name"
                  onChange={handleChange}
                  placeholder="Full name"
                  type="text"
                  value={values.name}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-invalid={
                    values.email.length > 0 && !values.email.includes('@')
                  }
                  autoComplete="email"
                  className="pl-9"
                  disabled={isSubmitting}
                  id="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="Email address"
                  type="email"
                  value={values.email}
                />
              </div>
              {values.email !== initialValues.email && (
                <p className="text-muted-foreground text-xs">
                  Changing your email may require verification
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone</Label>
              <div className="relative">
                <Phone className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  autoComplete="tel"
                  className="pl-9"
                  disabled={isSubmitting}
                  id="phoneNumber"
                  name="phoneNumber"
                  onChange={handleChange}
                  placeholder="Phone number"
                  type="tel"
                  value={values.phoneNumber}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={isSubmitting}
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!isDirty || isSubmitting}
            type="submit"
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </form>

      <div className="border-t pt-4">
        <h3 className="mb-2 font-medium text-muted-foreground text-sm">
          Security
        </h3>
        <ChangePasswordForm />
      </div>
      <div className="border-t pt-4">
        <h3 className="mb-4 font-medium text-muted-foreground text-sm">
          Active Sessions
        </h3>
        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Logout from all devices</h4>
              <p className="text-muted-foreground text-sm">
                This will sign you out from all browsers and devices where
                you're currently logged in.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isRevokingSessions}
                  size="sm"
                  variant="destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout from all devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will end all active sessions across all your devices.
                    You'll need to sign in again on each device. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isRevokingSessions}
                    onClick={handleLogoutAllDevices}
                  >
                    {isRevokingSessions ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Logging out...
                      </>
                    ) : (
                      'Logout All Devices'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
