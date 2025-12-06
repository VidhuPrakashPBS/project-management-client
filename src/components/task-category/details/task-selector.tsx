'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SubTaskLite = { id: string; name: string };

export function TaskSelector({
  label,
  tasks,
  selected,
  toggle,
  placeholder,
}: {
  label: string;
  tasks: SubTaskLite[];
  selected: string[];
  toggle: (id: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select onValueChange={toggle}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selected.length > 0
              ? `${selected.length} task(s) selected`
              : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tasks?.map((st) => (
            <SelectItem
              key={st.id}
              onSelect={(e) => e.preventDefault()}
              value={st.id}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selected.includes(st.id)}
                  className="pointer-events-none"
                />
                {st.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
