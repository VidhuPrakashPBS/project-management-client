'use client';

import { Mail, Phone, User2 } from 'lucide-react';
import { useRouter } from 'nextjs-toploader/app';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import {
  DEFAULT_VALUES,
  type ProfileDetails,
  type ProfileDetailsFormProps,
} from '@/types/user';
import { decryptId } from '@/utils/aes-security-encryption';
import { RoleCombobox } from './role-combobox';

interface Organisation {
  id: string;
  title: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileDetailsForm({
  userId,
  onSave,
  onCancel,
  className = '',
}: ProfileDetailsFormProps) {
  const [values, setValues] = useState<ProfileDetails>(DEFAULT_VALUES);
  const [initialValues, setInitialValues] =
    useState<ProfileDetails>(DEFAULT_VALUES);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState<boolean>(false);
  const [formReady, setFormReady] = useState<boolean>(false);
  const router = useRouter();

  const isDirty = useMemo(() => {
    return (
      values.name !== initialValues.name ||
      values.email !== initialValues.email ||
      values.phone !== initialValues.phone ||
      values.role.id !== initialValues.role.id ||
      values.organisationId !== initialValues.organisationId
    );
  }, [values, initialValues]);

  // Fetch organisations
  useEffect(() => {
    const normalizeOrgData = (data: Organisation | Organisation[]) => {
      return Array.isArray(data) ? data : [data];
    };

    const getErrorMessage = (error: unknown) => {
      return error instanceof Error
        ? error.message
        : 'Failed to load organisations';
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
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchOrganisations();
  }, []);

  // Fetch user details and their role
  useEffect(() => {
    const createUserProfile = (userData: {
      name?: string;
      email?: string;
      phoneNumber?: string;
      organisationId?: string;
      roleData?: {
        id: string;
        name: string;
      };
    }): ProfileDetails => {
      return {
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phoneNumber || '',
        role: {
          id: userData.roleData?.id || '',
          name: userData.roleData?.name || 'Member',
          value: userData.roleData?.name || 'Member',
        },
        organisationId: userData.organisationId || '',
      };
    };

    const getErrorMessage = (error: unknown, defaultMsg: string) => {
      return error instanceof Error ? error.message : defaultMsg;
    };

    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const decryptedUserId = decryptId(userId);

        // Fetch user details and role in parallel
        const [userResponse, roleResponse] = await Promise.all([
          api.get(`/api/user/${decryptedUserId}`),
          api.get(`/api/role-permissions/${decryptedUserId}`).catch(() => null),
        ]);

        if (!(userResponse.data.success && userResponse.data.data)) {
          toast.error(userResponse.data.message || 'User not found');
          return;
        }

        const userData = userResponse.data.data[0];

        // Extract role information from the response
        let roleData = {
          id: '',
          name: 'Member',
        };

        if (roleResponse?.data?.success && roleResponse.data.data) {
          // Response structure: { data: { id, name, description, permissions, ... } }
          const role = roleResponse.data.data;
          roleData = {
            id: role.id,
            name: role.name,
          };
        }

        const userProfile = createUserProfile({
          ...userData,
          roleData,
        });

        setValues(userProfile);
        setInitialValues(userProfile);
        setFormReady(true);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load user details'));
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setValues(initialValues);
    onCancel?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Saving changes...');

    try {
      const decryptedUserId = decryptId(userId) as string;

      // Update role if changed
      if (values.role.id !== initialValues.role.id) {
        await api.put(`/api/role-permissions/${decryptedUserId}`, {
          roleId: values.role.id,
        });
      }

      // Update user details
      const updateData: Record<string, string> = {
        name: values.name,
        email: values.email,
        phoneNumber: values.phone,
      };

      if (values.organisationId) {
        updateData.organisationId = values.organisationId;
      }

      await authClient.admin.updateUser({
        userId: decryptedUserId,
        data: updateData,
      });

      setInitialValues(values);

      toast.success('Profile updated successfully!', {
        id: loadingToast,
      });

      onSave?.(values);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update profile. Please try again.',
        {
          id: loadingToast,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`grid w-full gap-6 ${className}`}>
        <div className="space-y-1">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 5 })?.map((_, i) => (
              <div className="grid gap-2" key={i as number}>
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="h-10 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-16 animate-pulse rounded bg-gray-200" />
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
                  name="email"
                  onChange={handleChange}
                  placeholder="Email address"
                  type="email"
                  value={values.email}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  autoComplete="tel"
                  className="pl-9"
                  name="phone"
                  onChange={handleChange}
                  placeholder="Phone number"
                  type="tel"
                  value={values.phone}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <RoleCombobox
                dialogOpen={formReady}
                onValueChange={(role) => {
                  setValues((prev) => ({
                    ...prev,
                    role,
                  }));
                }}
                placeholder="Select role"
                value={values.role}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organisation">Organisation</Label>
              <Select
                disabled={isLoadingOrgs || organisations.length === 0}
                onValueChange={(val: string) =>
                  setValues((prev) => ({ ...prev, organisationId: val }))
                }
                value={values.organisationId}
              >
                <SelectTrigger className="w-full">
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
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={isSaving}
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isSaving || !isDirty}
            type="submit"
            variant="destructive"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
