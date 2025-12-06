import { useEffect, useState } from 'react';

type UUID = string;

export type EditSubTaskInput = {
  id: UUID;
  mainTaskId: UUID;
  title: string;
  description?: string;
  assigneeId?: UUID;
  startDate?: Date | null;
  endDate?: Date | null;
  precedingTaskIds?: UUID[];
  succeedingTaskIds?: UUID[];
  existingFiles?: { id: UUID; originalFilename: string; url: string }[];
};

export function useSubTaskForm(initial: EditSubTaskInput, open: boolean) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState<Date | null | undefined>(null);
  const [endDate, setEndDate] = useState<Date | null | undefined>(null);
  const [precedingTaskIds, setPrecedingTaskIds] = useState<string[]>([]);
  const [succeedingTaskIds, setSucceedingTaskIds] = useState<string[]>([]);
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<
    { id: UUID; originalFilename: string; url: string }[]
  >([]);
  const [removeFileIds, setRemoveFileIds] = useState<UUID[]>([]);

  useEffect(() => {
    if (open) {
      setName(initial.title ?? '');
      setDescription(initial.description ?? '');
      setAssigneeId(initial.assigneeId ?? '');
      setStartDate(initial.startDate ?? null);
      setEndDate(initial.endDate ?? null);
      setPrecedingTaskIds(initial.precedingTaskIds ?? []);
      setSucceedingTaskIds(initial.succeedingTaskIds ?? []);
      setExistingFiles(initial.existingFiles ?? []);
      setAddFiles([]);
      setRemoveFileIds([]);
    }
  }, [open, initial]);

  return {
    form: {
      name,
      description,
      assigneeId,
      startDate,
      endDate,
      precedingTaskIds,
      succeedingTaskIds,
      addFiles,
      existingFiles,
      removeFileIds,
    },
    actions: {
      setName,
      setDescription,
      setAssigneeId,
      setStartDate,
      setEndDate,
      setPrecedingTaskIds,
      setSucceedingTaskIds,
      setAddFiles,
      setExistingFiles,
      setRemoveFileIds,
    },
  };
}
