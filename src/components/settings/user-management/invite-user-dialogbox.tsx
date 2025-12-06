'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { InviteFormValues, InviteUserDialogProps } from '@/types/user';
import { RoleCombobox } from './role-combobox';

const EMAIL_REGEX = /\S+@\S+\.\S+/;

interface Organisation {
  id: string;
  title: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export function InviteUserDialog({
  trigger,
  onSubmit,
  submittingText = 'Sending invite…',
  submitText = 'Send invite',
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<InviteFormValues>({
    firstName: '',
    lastName: '',
    email: '',
    role: {
      id: '',
      name: '',
      value: '',
    },
    phoneNumber: '',
    photoFile: '',
    organisationId: '',
  });
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState<boolean>(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_REGEX.test(values.email);
  const phoneValid = values.phoneNumber.trim().length >= 6;

  const disabled =
    submitting ||
    !values.firstName.trim() ||
    !values.lastName.trim() ||
    !emailValid ||
    !phoneValid ||
    !values.organisationId;

  useEffect(() => {
    const normalizeOrgData = (data: Organisation | Organisation[]) => {
      return Array.isArray(data) ? data : [data];
    };

    const fetchOrganisations = async () => {
      try {
        setIsLoadingOrgs(true);
        const { data: result } = await api.get('/api/organisation');

        if (!(result.success && result.data)) {
          toast.error(result.message || 'Failed to load organisations');
          return;
        }

        const orgsData = normalizeOrgData(result.data);
        setOrganisations(orgsData);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load organisations'
        );
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchOrganisations();
  }, []);

  useEffect(() => {
    if (photoFile) {
      const objectUrl = URL.createObjectURL(photoFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    const dicebearUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${
      values.firstName || 'User'
    }`;
    setPreviewUrl(dicebearUrl);
  }, [photoFile, values.firstName]);

  function resetForm() {
    setValues({
      firstName: '',
      lastName: '',
      email: '',
      role: {
        id: '',
        name: '',
        value: '',
      },
      phoneNumber: '',
      photoFile: '',
      organisationId: '',
    });
    setPhotoFile(null);
  }

  async function handleSubmit() {
    try {
      const canCreateUser = await authClient.admin.hasPermission({
        permissions: {
          user: ['create'],
        },
      });

      if (canCreateUser) {
        setSubmitting(true);
        setError(null);
        await onSubmit?.({
          ...values,
          photoFile: photoFile ?? '',
        });
        resetForm();
        setOpen(false);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message ?? 'Failed to send invite');
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    setOpen(nextOpen);
  }

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Invite user</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
          <DialogDescription>
            Send an invitation email to join the workspace. Assign a role and
            add an optional profile photo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Photo upload */}
          <div className="grid gap-2">
            <label className="font-medium text-sm" htmlFor="photo">
              Photo
            </label>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage alt="Preview" src={previewUrl} />
                <AvatarFallback>
                  {values.firstName?.[0]?.toUpperCase() || 'U'}
                  {values.lastName?.[0]?.toUpperCase() || ''}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Input
                  accept="image/*"
                  className="max-w-xs"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPhotoFile(file);
                  }}
                  type="file"
                />
                {photoFile && (
                  <Button
                    onClick={() => setPhotoFile(null)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              PNG or JPG, up to ~2MB recommended.
            </p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="font-medium text-sm" htmlFor="firstName">
                First name
              </label>
              <Input
                onChange={(e) =>
                  setValues((v) => ({ ...v, firstName: e.target.value }))
                }
                placeholder="Jane"
                value={values.firstName}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="font-medium text-sm" htmlFor="lastName">
                Last name
              </label>
              <Input
                onChange={(e) =>
                  setValues((v) => ({ ...v, lastName: e.target.value }))
                }
                placeholder="Doe"
                value={values.lastName}
              />
            </div>
          </div>

          {/* Email */}
          <div className="grid gap-1.5">
            <label className="font-medium text-sm" htmlFor="email">
              Email
            </label>
            <Input
              onChange={(e) =>
                setValues((v) => ({ ...v, email: e.target.value }))
              }
              placeholder="jane@example.com"
              type="email"
              value={values.email}
            />
            {!emailValid && values.email && (
              <p className="text-red-600 text-xs">
                Enter a valid email address.
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="grid gap-1.5">
            <label className="font-medium text-sm" htmlFor="phoneNumber">
              Phone number
            </label>
            <Input
              inputMode="tel"
              onChange={(e) =>
                setValues((v) => ({ ...v, phoneNumber: e.target.value }))
              }
              placeholder="+91 98765 43210"
              type="tel"
              value={values.phoneNumber}
            />
            {!phoneValid && values.phoneNumber && (
              <p className="text-red-600 text-xs">
                Enter a valid phone number.
              </p>
            )}
          </div>

          {/* Organisation */}
          <div className="grid gap-1.5">
            <label className="font-medium text-sm" htmlFor="organisation">
              Organisation
            </label>
            <Select
              disabled={isLoadingOrgs || organisations.length === 0}
              onValueChange={(val: string) =>
                setValues((v) => ({ ...v, organisationId: val }))
              }
              value={values.organisationId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={(() => {
                    if (isLoadingOrgs) {
                      return 'Loading organisations...';
                    }
                    if (organisations.length === 0) {
                      return 'No organisations available';
                    }
                    return 'Select organisation';
                  })()}
                />
              </SelectTrigger>
              <SelectContent>
                {organisations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!values.organisationId && (
              <p className="text-muted-foreground text-xs">
                Please select an organisation for this user.
              </p>
            )}
          </div>

          {/* Role with Search and Pagination */}
          <div className="grid gap-1.5">
            <label className="font-medium text-sm" htmlFor="role">
              Role
            </label>
            <RoleCombobox
              dialogOpen={open}
              onValueChange={(role) => setValues((v) => ({ ...v, role }))}
              value={values.role}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button disabled={submitting} variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={disabled} onClick={handleSubmit}>
            {submitting ? submittingText : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
