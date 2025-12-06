'use client';
import { Camera } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { decryptId } from '@/utils/aes-security-encryption';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  owner: 'Owner',
  workingOwner: 'Working Owner',
  manager: 'Manager',
  workingManager: 'Working Manager',
  employee: 'Employee',
  vendor: 'Vendor',
};

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
      // Use updateUser instead of admin.updateUser for self-update
      await authClient.updateUser({
        image: response.data.data.url,
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

export default function AvatarSection({
  onChange,
  className = '',
}: {
  onChange?: (file: File, previewUrl: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
    image: string | null;
    role: string;
  } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await authClient.getSession();
      if (session.data?.user) {
        setUser(
          session.data.user as {
            id: string;
            email: string;
            name: string;
            image: string | null;
            role: string;
          }
        );
        setPreview(session.data.user.image || null);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const openPicker = () => inputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });

    onChange?.(file, url);

    setIsUploading(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const uploadedUrl = await uploadProfilePicture(file, user.id);
      setPreview(uploadedUrl);

      // Update local user state
      setUser((prev) => (prev ? { ...prev, image: uploadedUrl } : null));

      toast.success('Profile picture updated successfully');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to upload profile picture'
      );

      // Revert to previous image on error
      setPreview(user?.image ?? null);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`group relative inline-block ${className}`}>
        <button
          aria-label="Change profile photo"
          className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isUploading || !user}
          onClick={openPicker}
          type="button"
        >
          <Avatar className="h-50 w-50 overflow-hidden rounded-full transition-opacity duration-200 group-hover:opacity-60">
            <AvatarImage alt="Profile" src={preview ?? undefined} />
            <AvatarFallback>
              {user?.name
                ? user.name
                    .split(' ')
                    ?.map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'PN'}
            </AvatarFallback>
          </Avatar>

          <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" strokeWidth={1.5} />
          </span>

          {isUploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </span>
          )}
        </button>

        <input
          accept="image/*"
          className="hidden"
          disabled={isUploading || !user}
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
      </div>
      <span className="text-muted-foreground text-sm">
        {ROLE_LABELS[user?.role as string] ?? user?.role ?? '—'}
      </span>
    </div>
  );
}
