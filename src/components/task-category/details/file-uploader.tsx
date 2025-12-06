'use client';

import { File, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface FileUploaderProps {
  files: File[];
  setFiles: (files: File[]) => void;
}

export function FileUploader({ files, setFiles }: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) {
      return;
    }
    const newFiles = Array.from(selectedFiles);
    setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (fileName: string) => {
    setFiles(files.filter((file) => file.name !== fileName));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <button
        className={`flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 hover:bg-muted ${
          isDragActive ? 'border-primary' : 'border-border'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragActive(true);
        }}
        onDrop={handleDrop}
        type="button"
      >
        <input
          className="hidden"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          ref={inputRef}
          type="file"
        />

        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
          <UploadCloud className="mb-2 h-8 w-8" />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag & drop some files here, or click to select</p>
          )}
        </div>
      </button>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Uploaded Files:</h4>
          <div className="flex flex-wrap gap-2">
            {files?.map((file) => (
              <Badge
                className="flex items-center gap-2"
                key={file.name}
                variant="secondary"
              >
                <File className="h-3 w-3" />
                {file.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFile(file.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      removeFile(file.name);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
