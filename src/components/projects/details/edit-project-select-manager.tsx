'use client';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ManagerProps } from '@/types/project';

export default function ManagerSelect({
  formData,
  managers,
  loadingManagers,
  setFormData,
}: ManagerProps) {
  const handleManagerSelect = (managerId: string) => {
    setFormData((prev) => {
      const current = prev.assignedManagersId;
      return current.includes(managerId)
        ? {
            ...prev,
            assignedManagersId: current.filter((id) => id !== managerId),
          }
        : { ...prev, assignedManagersId: [...current, managerId] };
    });
  };

  const removeManager = (managerId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedManagersId: prev.assignedManagersId.filter(
        (id) => id !== managerId
      ),
    }));
  };

  const selectedManagers = managers.filter((m) =>
    formData.assignedManagersId.includes(m.id as string)
  );

  return (
    <div>
      <Label htmlFor="managers">Assigned Managers (Optional)</Label>
      <Select onValueChange={handleManagerSelect}>
        <SelectTrigger>
          <SelectValue
            placeholder={
              loadingManagers ? 'Loading managers...' : 'Select managers'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {managers?.map((manager) => (
            <SelectItem
              className={
                formData.assignedManagersId.includes(manager.id as string)
                  ? 'bg-accent'
                  : ''
              }
              key={manager.id}
              value={manager.id as string}
            >
              {manager.name}
            </SelectItem>
          ))}
          {managers.length === 0 && !loadingManagers && (
            <SelectItem disabled value="no-managers">
              No managers available
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {selectedManagers.length > 0 && (
        <div className="mt-2">
          <p className="mb-2 text-muted-foreground text-sm">
            Selected managers:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedManagers?.map((manager) => (
              <div
                className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-secondary-foreground text-sm"
                key={manager.id}
              >
                <span>{manager.name}</span>
                <button
                  className="ml-1 hover:text-destructive"
                  onClick={() => removeManager(manager.id)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
