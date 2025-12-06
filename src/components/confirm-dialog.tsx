'use client';

import type * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ConfirmMode = 'confirm' | 'onlyOk';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: ConfirmMode;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  mode = 'confirm',
  icon,
  title,
  description,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {icon ? <div>{icon}</div> : null}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          {mode === 'confirm' ? (
            <>
              <AlertDialogCancel onClick={onCancel}>
                {cancelText}
              </AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>
                {confirmText}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={onConfirm}>
              {confirmText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
