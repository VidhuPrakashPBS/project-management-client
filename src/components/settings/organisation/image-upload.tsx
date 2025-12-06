'use client';

import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ImageUploadProps } from '@/types/organisation';

export default function ImageUpload({
  previewUrl,
  error,
  onFileChange,
  onRemove,
}: ImageUploadProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="image">Organisation Logo</Label>
      <div className="space-y-4">
        {previewUrl && (
          <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
            <Image
              alt="Preview"
              className="object-cover"
              fill
              src={previewUrl}
            />
            <Button
              className="absolute top-1 right-1 h-6 w-6"
              onClick={onRemove}
              size="icon"
              type="button"
              variant="destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            className={`cursor-pointer ${error ? 'border-destructive' : ''}`}
            id="image"
            onChange={onFileChange}
            type="file"
          />
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-muted-foreground text-sm">
          Upload an image for the organisation logo (Max 5MB, JPEG, PNG, GIF,
          WEBP)
        </p>
      </div>
    </div>
  );
}
