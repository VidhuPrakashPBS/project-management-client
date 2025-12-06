import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '../index.css';
import dynamic from 'next/dynamic';
import NextTopLoader from 'nextjs-toploader';
import NotificationHandler from '@/components/layout/notification-permission';
import Providers from '@/components/providers';

const Toaster = dynamic(
  () => import('@/components/ui/sonner').then((mod) => mod.Toaster),
  { ssr: true }
);

const geistSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Project Management System',
  description: 'A project management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader
          color="#2563eb"
          height={3}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
          showSpinner={false}
          speed={200}
        />
        <Providers>
          <div className="grid h-svh grid-rows-[auto_1fr]">{children}</div>
          <Toaster />
          <NotificationHandler />
        </Providers>
      </body>
    </html>
  );
}
