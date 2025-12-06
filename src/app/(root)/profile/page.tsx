import AvatarSection from '@/components/profile/avatar-section';
import ProfileDetailsForm from '@/components/profile/form-section';

export default function ProfilePage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between" />
      <div className="block w-full flex-row gap-10 md:flex">
        <AvatarSection />
        <div className="w-full">
          <ProfileDetailsForm />
        </div>
      </div>
    </div>
  );
}
