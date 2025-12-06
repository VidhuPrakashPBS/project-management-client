import ProfileSettings from '@/components/profile-settings/profile-settings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 font-bold text-2xl">Settings</h1>
      <ProfileSettings />
    </div>
  );
}
