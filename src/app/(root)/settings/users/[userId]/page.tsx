'use client';
import { toast } from 'sonner';
import AvatarSection from '@/components/settings/user-management/avatar-section';
import HeaderActions from '@/components/settings/user-management/header-action';
import PasswordSection from '@/components/settings/user-management/password-section';
import ProfileDetailsForm from '@/components/settings/user-management/profile-details-form';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { decryptId } from '@/utils/aes-security-encryption';

const uploadProfilePicture = async (
  file: File,
  userId: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  formData.append('userId', decryptId(userId) as string);

  try {
    const response = await api.post(
      '/api/user/upload-profile-picture',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    if (response.data?.success && response.data?.data?.url) {
      await authClient.admin.updateUser({
        userId: decryptId(userId) as string,
        data: {
          image: response.data.data.url,
        },
      });
      return response.data.data.url;
    }

    throw new Error(
      response.data?.error?.message || 'Failed to upload profile picture'
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error');
  }
};

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function UserDetailsPage({ params }: PageProps) {
  const { userId } = await params;

  const handleProfilePictureChange = async (file: File) => {
    const toastId = toast.loading('Uploading profile picture...');
    try {
      await uploadProfilePicture(file, userId);

      toast.success('Profile picture updated successfully!', { id: toastId });
    } catch (error) {
      toast.error(`Failed to upload profile picture ${error}`, { id: toastId });
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Profile</h1>
          <span className="text-muted-foreground">Manage user profile</span>
        </div>
        <HeaderActions userId={userId} />
      </div>
      <div className="block w-full flex-row gap-10 md:flex">
        <AvatarSection
          onChange={(e) => {
            handleProfilePictureChange(e);
          }}
          userId={userId}
        />
        <div className="grid w-full gap-6">
          <ProfileDetailsForm userId={userId} />
          <div className="border-t pt-4">
            <h3 className="mb-2 font-medium text-muted-foreground text-sm">
              Security
            </h3>
            <PasswordSection userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}
