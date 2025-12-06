import { FloatingNav } from '@/components/layout/floating-nav';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <FloatingNav />
      <div className="flex-1 md:ml-24 ">
        <Header />
        <main className="scrollbar-hide mt-20 min-h-screen max-w-screen p-4 md:mt-10 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
