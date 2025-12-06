'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormInputProps } from '@/types/organisation';

export default function FormInput({
  id,
  name,
  label,
  type = 'text',
  value,
  placeholder,
  required = false,
  min,
  max,
  error,
  onChange,
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        className={error ? 'border-destructive' : ''}
        id={id}
        max={max}
        min={min}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
