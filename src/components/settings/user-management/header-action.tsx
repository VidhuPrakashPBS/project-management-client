'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { decryptId } from '@/utils/aes-security-encryption';

export default function HeaderActions({ userId }: { userId: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [id, setId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const data = decryptId(userId);
    setId(data as string);
  }, [userId]);

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    const loadingToast = toast.loading('Deleting user...');

    try {
      const result = await authClient.admin.removeUser({
        userId: id,
      });

      if (result.data?.success) {
        toast.success('User deleted successfully!', {
          id: loadingToast,
        });

        setOpen(false);

        // Navigate back to users list after successful deletion
        router.push('/settings/users');
        router.refresh();
      } else {
        toast.error('Failed to delete user. Please try again.', {
          id: loadingToast,
        });
      }
    } catch (error) {
      toast.error(`An error occurred while deleting the user. ${error}`, {
        id: loadingToast,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        className="flex items-center gap-2"
        onClick={() => setOpen(true)}
        size="sm"
        variant="destructive"
      >
        <Trash2 className="h-4 w-4" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>

      <ConfirmDialog
        cancelText="No"
        confirmText="Yes"
        description={'This action cannot be undone. Delete user?'}
        icon={<Trash2 className="h-6 w-6 text-destructive" />}
        mode="confirm"
        onCancel={() => setOpen(false)}
        onConfirm={handleDeleteUser}
        onOpenChange={setOpen}
        open={open}
        title="Delete user?"
      />
    </div>
  );
}
