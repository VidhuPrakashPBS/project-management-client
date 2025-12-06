'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type UUID = string;

export function FileList({
  files,
  onRemove,
}: {
  files: { id: UUID; originalFilename: string; url: string }[];
  onRemove: (id: UUID) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>Existing Files</Label>
      {files.length === 0 ? (
        <p className="text-muted-foreground text-xs">No files</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {files?.map((f) => (
            <div
              className="flex items-center gap-2 rounded border px-2 py-1 text-xs"
              key={f.id}
            >
              <a
                className="underline underline-offset-2"
                href={f.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {f.originalFilename}
              </a>
              <Button
                className="h-6 px-2"
                onClick={() => onRemove(f.id)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
