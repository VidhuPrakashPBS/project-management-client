'use client';
import {
  Archive,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { projectFile } from '@/types/project';

interface FilePreviewProps {
  file: projectFile;
  size?: number;
  className?: string;
}

const getFileTypeFromMimeType = (
  mimeType: string
): 'image' | 'pdf' | 'video' | 'audio' | 'archive' | 'document' => {
  if (mimeType?.startsWith('image/')) {
    return 'image';
  }
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType?.startsWith('video/')) {
    return 'video';
  }
  if (mimeType?.startsWith('audio/')) {
    return 'audio';
  }
  if (
    mimeType?.includes('zip') ||
    mimeType?.includes('rar') ||
    mimeType?.includes('7z') ||
    mimeType === 'application/x-compressed' ||
    mimeType === 'application/x-zip-compressed'
  ) {
    return 'archive';
  }
  return 'document';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

export default function FilePreview({
  file,
  size = 44,
  className = '',
}: FilePreviewProps) {
  const [imageError, setImageError] = useState<boolean>(false);

  const fileType = getFileTypeFromMimeType(file.mimeType);
  const containerClass = `group relative rounded-md border border-border transition-transform hover:scale-105 cursor-pointer ${className}`;
  const sizeStyle = { width: size, height: size };

  if (fileType === 'image' && !imageError) {
    return (
      <Link className={containerClass} href={file.url} style={sizeStyle}>
        <Image
          alt={file.originalFilename}
          className="rounded-md object-cover"
          fill
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
          sizes={`${size}px`}
          src={file.url}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="mb-1 max-w-full truncate rounded bg-black/80 px-1 py-0.5 font-medium text-white text-xs">
            {file.originalFilename}
          </span>
          <span className="rounded bg-black/60 px-1 py-0.5 text-white text-xs">
            {formatFileSize(file.fileSize)}
          </span>
        </div>
      </Link>
    );
  }

  if (fileType === 'pdf') {
    return (
      <Link
        className={`${containerClass} flex items-center justify-center bg-red-50 dark:bg-red-950/20`}
        href={file.url}
        style={sizeStyle}
      >
        <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="mb-1 max-w-full truncate rounded bg-black/80 px-1 py-0.5 font-medium text-white text-xs">
            {file.originalFilename}
          </span>
          <span className="rounded bg-black/60 px-1 py-0.5 text-white text-xs">
            {formatFileSize(file.fileSize)}
          </span>
        </div>
      </Link>
    );
  }

  if (fileType === 'video') {
    return (
      <Link
        className={`${containerClass} flex items-center justify-center bg-blue-50 dark:bg-blue-950/20`}
        href={file.url}
        style={sizeStyle}
      >
        <FileVideo className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="mb-1 max-w-full truncate rounded bg-black/80 px-1 py-0.5 font-medium text-white text-xs">
            {file.originalFilename}
          </span>
          <span className="rounded bg-black/60 px-1 py-0.5 text-white text-xs">
            {formatFileSize(file.fileSize)}
          </span>
        </div>
      </Link>
    );
  }

  if (fileType === 'audio') {
    return (
      <Link
        className={`${containerClass} flex items-center justify-center bg-purple-50 dark:bg-purple-950/20`}
        href={file.url}
        style={sizeStyle}
      >
        <FileAudio className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="mb-1 max-w-full truncate rounded bg-black/80 px-1 py-0.5 font-medium text-white text-xs">
            {file.originalFilename}
          </span>
          <span className="rounded bg-black/60 px-1 py-0.5 text-white text-xs">
            {formatFileSize(file.fileSize)}
          </span>
        </div>
      </Link>
    );
  }

  if (fileType === 'archive') {
    return (
      <Link
        className={`${containerClass} flex items-center justify-center bg-orange-50 dark:bg-orange-950/20`}
        href={file.url}
        style={sizeStyle}
      >
        <Archive className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="mb-1 max-w-full truncate rounded bg-black/80 px-1 py-0.5 font-medium text-white text-xs">
            {file.originalFilename}
          </span>
          <span className="rounded bg-black/60 px-1 py-0.5 text-white text-xs">
            {formatFileSize(file.fileSize)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      className={`${containerClass} flex items-center justify-center bg-muted`}
      href={file.url}
      style={sizeStyle}
    >
      {imageError ? (
        <FileImage className="h-6 w-6 text-muted-foreground" />
      ) : (
        <File className="h-6 w-6 text-muted-foreground" />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="mb-1 max-w-full truncate rounded bg-black/80 px-1 py-0.5 font-medium text-white text-xs">
          {file.originalFilename}
        </span>
        <span className="rounded bg-black/60 px-1 py-0.5 text-white text-xs">
          {formatFileSize(file.fileSize)}
        </span>
      </div>
    </Link>
  );
}
