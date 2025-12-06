'use client';

import { Camera } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';
import type { AvatarSectionProps, User } from '@/types/user';
import { decryptId } from '@/utils/aes-security-encryption';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  owner: 'Owner',
  workingOwner: 'Working Owner',
  manager: 'Manager',
  workingManager: 'Working Manager',
  employee: 'Employee',
  vendor: 'Vendor',
};

export default function AvatarSection({
  onChange,
  userId,
  className = '',
}: AvatarSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(
    'https://api.dicebear.com/9.x/glass/svg'
  );
  const [user, setUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    image: '',
    role: '',
  });

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    const fetchImage = async () => {
      const result = await api.get(`/api/user/${decryptId(userId)}`);
      setPreview(result.data.data.data[0].image as string);
      setUser(result.data.data.data[0]);
    };

    fetchImage();
  }, [userId]);

  const openPicker = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
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
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`group relative inline-block ${className}`}>
        <button
          aria-label="Change profile photo"
          className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={openPicker}
          type="button"
        >
          <Avatar className="h-50 w-50 overflow-hidden rounded-full transition-opacity duration-200 group-hover:opacity-60">
            <AvatarImage alt="Profile" src={preview ?? undefined} />
            <AvatarFallback>PN</AvatarFallback>
          </Avatar>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" strokeWidth={1.5} />
          </span>
        </button>
        <input
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
      </div>
      <h1 className="font-bold ">{user.name}</h1>
      <span className="text-muted-foreground">
        {ROLE_LABELS[user?.role as string] ?? user.role ?? '—'}
      </span>
    </div>
  );
}
