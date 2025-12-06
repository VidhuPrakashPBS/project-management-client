import { TabsNav } from '@/components/layout/settings-tab-navs';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TabsNav />
      <div>{children}</div>
    </div>
  );
}
