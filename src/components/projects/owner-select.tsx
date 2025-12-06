import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types/user';

interface Props {
  formData: { userId: string };
  errors: Record<string, string>;
  owners: User[];
  loadingOwners: boolean;
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      budget: string;
      userId: string;
      assignedManagersId: string[];
      files: File[];
    }>
  >;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function OwnerSelect({
  formData,
  errors,
  owners,
  loadingOwners,
  setFormData,
  setErrors,
}: Props) {
  const handleOwnerSelect = (ownerId: string) => {
    setFormData((prev) => ({ ...prev, userId: ownerId }));
    if (errors.ownerId) {
      setErrors((prev) => ({ ...prev, ownerId: '' }));
    }
  };

  const selectedOwner = owners.find((o) => o.id === formData.userId);

  return (
    <div>
      <Label htmlFor="owner">Owner *</Label>
      <Select onValueChange={handleOwnerSelect} value={formData.userId}>
        <SelectTrigger className={errors.ownerId ? 'border-red-500' : ''}>
          <SelectValue
            placeholder={
              loadingOwners ? 'Loading owners...' : 'Select an owner'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {owners?.map((owner) => (
            <SelectItem key={owner.id} value={owner.id as string}>
              {owner.name}
            </SelectItem>
          ))}
          {owners.length === 0 && !loadingOwners && (
            <SelectItem disabled value="no-owners">
              No owners available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {errors.ownerId && (
        <p className="mt-1 text-red-500 text-sm">{errors.ownerId}</p>
      )}

      {selectedOwner && (
        <div className="mt-2">
          <p className="mb-1 text-muted-foreground text-sm">Selected owner:</p>
          <div className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-primary text-sm">
            <span>{selectedOwner.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
