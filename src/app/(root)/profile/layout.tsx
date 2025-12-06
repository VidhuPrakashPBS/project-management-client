'use client';

import { SettingsIcon, User2Icon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isProfileActive = pathname === '/profile';
  const isSettingsActive = pathname.startsWith('/profile/settings');

  return (
    <div className="h-full w-full">
      <div className="flex gap-4">
        <Link
          className={[
            'flex items-center gap-2 rounded-2xl p-2 shadow-xl',
            isProfileActive ? 'border border-primary text-primary' : '',
          ].join(' ')}
          href="/profile"
        >
          <User2Icon size={20} />
          <span>Profile</span>
        </Link>

        <Link
          className={[
            'flex items-center gap-2 rounded-2xl p-2 shadow-xl',
            isSettingsActive ? 'border border-primary text-primary' : '',
          ].join(' ')}
          href="/profile/settings"
        >
          <SettingsIcon size={20} />
          <span>Profile Settings</span>
        </Link>
      </div>

      <div className="mt-4 h-full">{children}</div>
    </div>
  );
}
