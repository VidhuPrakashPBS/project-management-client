'use client';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OwnerSlectProps } from '@/types/project';

export default function OwnerSelect({
  formData,
  errors,
  owners,
  loadingOwners,
  setFormData,
  setErrors,
}: OwnerSlectProps) {
  const handleOwnerSelect = (ownerId: string) => {
    setFormData((prev) => ({ ...prev, ownerId }));
    if (errors.ownerId) {
      setErrors((prev) => ({ ...prev, ownerId: '' }));
    }
  };

  const selectedOwner = owners.find((o) => o.id === formData.ownerId);

  return (
    <div>
      <Label htmlFor="owner">Owner *</Label>
      <Select onValueChange={handleOwnerSelect} value={formData.ownerId}>
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
