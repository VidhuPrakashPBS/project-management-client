'use client';

import { Ban, Plus, Trash2, UserCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppTable, type CommonTableColumn } from '@/components/app-table';
import ConfirmDialog from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { generateInvitationEmailHTML, sendEmail } from '@/lib/email';
import type {
  DataRow,
  InviteFormValues,
  UserWithRoleExtend,
} from '@/types/user';
import { encryptId } from '@/utils/aes-security-encryption';
import { generateSecurePassword } from '@/utils/generate-password';
import { InviteUserDialog } from './invite-user-dialogbox';
import PaginationControls from './pagination-controller';

export default function UserTableSection() {
  const [query, setQuery] = useState<string>('');
  const [rows, setRows] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const [canCreateUser, setCanCreateUser] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [banDialogOpen, setBanDialogOpen] = useState<boolean>(false);
  const [banUserId, setBanUserId] = useState<string>('');
  const [banAction, setBanAction] = useState<'ban' | 'unban'>('ban');
  const [canBanUser, setCanBanUser] = useState<boolean>(false);

  const listUsers = useCallback(
    async (page = 0, limit = 10, searchQuery?: string) => {
      setLoading(true);
      try {
        const offset = page * limit;
        const users = await authClient.admin.listUsers({
          query: {
            limit,
            offset,
            ...(searchQuery && {
              searchValue: searchQuery.toLowerCase(),
              searchField: 'name' as const,
              searchOperator: 'contains' as const,
            }),
          },
        });

        const demo =
          users.data?.users?.map((user) => {
            const ExtendedUser = user as unknown as UserWithRoleExtend;

            return {
              id: ExtendedUser.id,
              empId: ExtendedUser.empId ?? '',
              profilePicture: ExtendedUser.image ?? '',
              name: ExtendedUser.name,
              image: ExtendedUser.image,
              role: ExtendedUser.role ?? '',
              email: ExtendedUser.email,
              phoneNumber: ExtendedUser.phoneNumber ?? '',
              banned: ExtendedUser.banned ?? false,
              createdAt: new Date(ExtendedUser.createdAt).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }
              ),
            };
          }) || [];

        setRows(demo);

        if (users.data) {
          setTotalUsers(users.data.total || 0);
          setTotalPages(Math.ceil((users.data.total || 0) / limit));
        }
      } catch (error) {
        // console.error('Error fetching users:', error);
        toast.error(`Error fetching users ${error}`, { duration: 3000 });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const checkPermissions = async () => {
      const permission = await authClient.admin.hasPermission({
        permissions: {
          user: ['create'],
        },
      });

      const banPermission = await authClient.admin.hasPermission({
        permissions: {
          user: ['ban'],
        },
      });

      if (permission.data?.success) {
        setCanCreateUser(permission?.data?.success);
      }

      if (banPermission.data?.success) {
        setCanBanUser(banPermission?.data?.success);
      }
    };

    checkPermissions();
    listUsers(currentPage, pageSize);
  }, [currentPage, pageSize, listUsers]);

  const columns = useMemo<CommonTableColumn<DataRow>[]>(
    () => [
      {
        key: 'name',
        label: 'Name',
        render: (_value, row) => (
          <Link
            className="flex items-center gap-2"
            href={`/settings/users/${encryptId(row.id)}`}
          >
            <Image
              alt={`Avatar for ${row.name}`}
              className="h-8 w-8 min-w-8 rounded-full object-cover"
              height={32}
              src={
                row.image?.trim()
                  ? row.image.trim()
                  : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(row.name || 'user')}`
              }
              width={32}
            />
            <span className="font-medium">{row.name}</span>
            {row.empId ? (
              <span className="text-muted-foreground text-xs">{row.empId}</span>
            ) : null}
          </Link>
        ),
      },
      {
        key: 'role',
        label: 'Role',
        render: (value, row) => (
          <Link href={`/settings/users/${encryptId(row.id)}`}>{value}</Link>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        render: (value, row) => (
          <Link href={`/settings/users/${encryptId(row.id)}`}>{value}</Link>
        ),
      },
      {
        key: 'phoneNumber',
        label: 'Phone',
        render: (value, row) => (
          <Link href={`/settings/users/${encryptId(row.id)}`}>{value}</Link>
        ),
      },
      {
        key: 'ban',
        label: 'Ban',
        render: (_value, row) => (
          <Link
            className={[
              'inline-flex items-center rounded-full px-2 py-1 font-medium text-xs',
              !row.banned && 'bg-emerald-100 text-emerald-700',
              row.banned && 'bg-amber-100 text-amber-700',
            ]
              .filter(Boolean)
              .join(' ')}
            href={`/settings/users/${encryptId(row.id)}`}
          >
            {row.banned ? 'Banned' : 'Active'}
          </Link>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (_value, row) =>
          new Date(row.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          }),
      },
      {
        key: 'actions',
        label: '',
        render: (_value, row) => (
          <div className="flex items-center justify-end gap-2">
            {canBanUser && (
              <Button
                className={
                  row.banned
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-orange-600 hover:text-orange-700'
                }
                onClick={() => {
                  setBanUserId(row.id);
                  setBanAction(row.banned ? 'unban' : 'ban');
                  setBanDialogOpen(true);
                }}
                size="sm"
                variant="ghost"
              >
                {row.banned ? <UserCheck size={16} /> : <Ban size={16} />}
              </Button>
            )}
            <Button
              onClick={() => {
                setDeleteId(row?.id);
                setOpen(true);
              }}
              size="sm"
              variant="ghost"
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [canBanUser]
  );

  /**
   * Upload profile picture for a user
   */
  const uploadProfilePicture = async (
    file: File,
    userId: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    formData.append('userId', userId);

    try {
      const response = await api.post(
        '/api/user/upload-profile-picture',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.success && response.data?.data?.url) {
        return response.data.data.url;
      }

      throw new Error(
        response.data?.error?.message || 'Failed to upload profile picture'
      );
    } catch (error) {
      throw new Error(`Profile picture upload failed: ${error}`);
    }
  };

  /**
   * Handle profile picture upload and user update
   */
  const handleProfilePictureUpload = async (
    photoFile: File | undefined,
    userId: string,
    firstName: string
  ): Promise<string> => {
    // Use default avatar if no file provided
    if (!photoFile) {
      return `https://api.dicebear.com/9.x/thumbs/svg?seed=${firstName}`;
    }

    try {
      const uploadedImageUrl = await uploadProfilePicture(photoFile, userId);

      // Update user with uploaded image URL
      await authClient.admin.updateUser({
        userId,
        data: {
          image: uploadedImageUrl,
        },
      });

      return uploadedImageUrl;
    } catch (uploadError) {
      toast.warning(
        `Profile picture upload failed. Using default avatar. ${uploadError}`,
        { duration: 5000 }
      );
      return `https://api.dicebear.com/9.x/thumbs/svg?seed=${firstName}`;
    }
  };

  /**
   * Send invitation email to new user
   */
  const sendInvitationEmail = async (
    userName: string,
    email: string,
    temporaryPassword: string
  ): Promise<boolean> => {
    const loginUrl = `${window.location.origin}/`;

    const emailHTML = generateInvitationEmailHTML({
      userName,
      email,
      temporaryPassword,
      loginUrl,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to PBS Project Management - Account Created',
      html: emailHTML,
    });

    return emailResult.success;
  };

  /**
   * Create a new user with the provided details
   */
  const createNewUser = async (
    values: InviteFormValues,
    temporaryPassword: string
  ) => {
    const defaultImage = `https://api.dicebear.com/9.x/thumbs/svg?seed=${values.firstName}`;

    const res = await authClient.admin.createUser({
      name: `${values.firstName} ${values.lastName}`,
      password: temporaryPassword,
      email: values.email,
      // role: values.role,
      // TODO: Add role assignment through custom api
      data: {
        phoneNumber: values.phoneNumber,
        image: defaultImage,
        organisationId: values.organisationId,
      },
    });

    if (res.data?.user && values.role) {
      await api.post('/api/role-permissions/assign-user-role', {
        userId: res.data.user.id,
        roleId: values.role.id,
      });

      return res;
    }
  };

  /**
   * Handle sending an invite to a new user
   */
  const handleInviteUserSubmit = async (values: InviteFormValues) => {
    const loadingToast = toast.loading(
      'Creating user and sending invitation...'
    );
    const temporaryPassword = generateSecurePassword(12);

    try {
      // Create user
      const user = await createNewUser(values, temporaryPassword);

      if (!user?.data?.user) {
        toast.error('Failed to create user. Please try again.', {
          id: loadingToast,
        });
        return;
      }

      // Handle profile picture upload
      await handleProfilePictureUpload(
        values.photoFile as File,
        user.data.user.id,
        values.firstName
      );

      // Send invitation email
      const userName = `${values.firstName} ${values.lastName}`;
      const emailSuccess = await sendInvitationEmail(
        userName,
        values.email,
        temporaryPassword
      );

      // Refresh user list
      listUsers(currentPage, pageSize, query);

      // Show appropriate success/warning message
      if (emailSuccess) {
        toast.success(
          `User ${userName} has been created and invitation email sent!`,
          { id: loadingToast }
        );
      } else {
        toast.warning(
          'User created successfully, but invitation email failed to send. Please contact the user manually.',
          { id: loadingToast }
        );
      }
    } catch (error) {
      toast.error(`Failed to create user: ${error}`, {
        id: loadingToast,
      });
    }
  };

  /**
   * Handles a form submission event by preventing the default form submission action,
   * resetting the current page to the first page and re-fetching the user list with the new page number.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page when searching
    listUsers(0, pageSize, query);
  };

  /**
   * Handles a change in the page number by resetting the current page to the new page and re-fetching the user list with the new page number.
   * @param {number} newPage - The new page number.
   */
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    listUsers(newPage, pageSize, query);
  };

  /**
   * Handles a change in the page size by resetting the current page to 0
   * and re-fetching the user list with the new page size.
   * @param {number} newPageSize - The new page size.
   */
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0); // Reset to first page
    listUsers(0, newPageSize, query);
  };

  /**
   * Handles deletion of a user by calling the authClient admin removeUser
   * and updating the user list after a successful deletion.
   * @returns {Promise<void>}
   */
  const handleDeleteUser = async () => {
    try {
      const res = await authClient.admin.removeUser({ userId: deleteId });
      if (res.data?.success) {
        listUsers(currentPage, pageSize, query);
        setOpen(false);
        toast.success('User has been deleted', { duration: 3000 });
      }
    } catch (error) {
      toast.error(`Error delete user ${error}`, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles banning or unbanning of a user by calling the authClient admin banUser or unbanUser
   * and updating the user list after a successful ban or unban.
   * @returns {Promise<void>}
   */
  const handleBanUser = async () => {
    try {
      if (banAction === 'ban') {
        const res = await authClient.admin.banUser({
          userId: banUserId,
          banReason: 'Banned by administrator',
          // banExpiresIn: undefined, // Permanent ban, or set a number for temporary ban
        });

        if (res.data?.user) {
          listUsers(currentPage, pageSize, query);
          setBanDialogOpen(false);
          toast.success('User has been banned', { duration: 3000 });
        }
      } else {
        const res = await authClient.admin.unbanUser({
          userId: banUserId,
        });

        if (res.data?.user) {
          listUsers(currentPage, pageSize, query);
          setBanDialogOpen(false);
        }
      }
    } catch (error) {
      toast.error(`Error banning user ${error}`, { duration: 3000 });
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="flex w-full items-stretch gap-2 sm:max-w-md"
          onSubmit={handleSearch}
        >
          <label className="sr-only" htmlFor="q">
            Search users
          </label>
          <Input
            aria-label="Search users"
            autoComplete="off"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            name="q"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, or ID"
            type="search"
            value={query}
          />
          <button
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            type="submit"
          >
            Search
          </button>
        </form>

        {canCreateUser && (
          <div className="flex items-center gap-2">
            <InviteUserDialog
              onSubmit={handleInviteUserSubmit}
              trigger={
                <Button variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Invite user
                </Button>
              }
            />
          </div>
        )}
      </div>

      <AppTable<DataRow>
        columns={columns}
        data={rows}
        emptyMessage={query ? 'No users match the search.' : 'No users yet.'}
        loading={loading}
      />

      <PaginationControls
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        query={query}
        totalPages={totalPages}
        totalUsers={totalUsers}
      />

      <ConfirmDialog
        cancelText="No"
        confirmText="Yes"
        description={`This action cannot be undone. Delete user ${deleteId}?`}
        icon={<Trash2 className="h-6 w-6 text-destructive" />}
        mode="confirm"
        onCancel={() => setOpen(false)}
        onConfirm={handleDeleteUser}
        onOpenChange={setOpen}
        open={open}
        title="Delete user?"
      />

      <ConfirmDialog
        cancelText="Cancel"
        confirmText={banAction === 'ban' ? 'Ban User' : 'Unban User'}
        description={
          banAction === 'ban'
            ? 'This will prevent the user from signing in. Are you sure you want to ban this user?'
            : 'This will allow the user to sign in again. Are you sure you want to unban this user?'
        }
        icon={
          banAction === 'ban' ? (
            <Ban className="h-6 w-6 text-orange-600" />
          ) : (
            <UserCheck className="h-6 w-6 text-green-600" />
          )
        }
        mode="confirm"
        onCancel={() => setBanDialogOpen(false)}
        onConfirm={handleBanUser}
        onOpenChange={setBanDialogOpen}
        open={banDialogOpen}
        title={banAction === 'ban' ? 'Ban User?' : 'Unban User?'}
      />
    </div>
  );
}
