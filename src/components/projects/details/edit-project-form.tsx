import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { projectFile } from '@/types/project';

interface Props {
  formData: {
    title: string;
    description: string;
    budget: string;
    files: File[];
    existingFiles: projectFile[];
  };
  errors: Record<string, string>;
  loading?: boolean;
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      budget: string;
      ownerId: string;
      assignedManagersId: string[];
      files: File[];
      existingFiles: projectFile[];
      filesToDelete: string[];
    }>
  >;
  onRemoveExistingFile: (fileId: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function ProjectFormFields({
  formData,
  errors,
  loading = false,
  setFormData,
  setErrors,
  onRemoveExistingFile,
}: Props) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle file selection
  const onPickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    setFormData((prev) => {
      const added = Array.from(files);
      const existing = new Set(
        prev.files?.map((f) => `${f.name}-${f.size}-${f.type}`)
      );
      const merged = [
        ...prev.files,
        ...added.filter((f) => !existing.has(`${f.name}-${f.size}-${f.type}`)),
      ];
      return { ...prev, files: merged };
    });
  };

  // Remove file at specific index (for new files)
  const removeFileAt = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // Format file size helper function
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          className={errors.title ? 'border-red-500' : ''}
          disabled={loading}
          id="title"
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter project title"
          value={formData.title}
        />
        {errors.title && (
          <p className="mt-1 text-red-500 text-sm">{errors.title}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          className={`resize-none ${
            errors.description ? 'border-red-500' : ''
          }`}
          disabled={loading}
          id="description"
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter project description"
          rows={3}
          value={formData.description}
        />
        {errors.description && (
          <p className="mt-1 text-red-500 text-sm">{errors.description}</p>
        )}
      </div>

      <div>
        <Label htmlFor="budget">Budget</Label>
        <Input
          className={errors.budget ? 'border-red-500' : ''}
          disabled={loading}
          id="budget"
          onChange={(e) => handleChange('budget', e.target.value)}
          placeholder="Enter project budget"
          type="text"
          value={formData.budget}
        />
        {errors.budget && (
          <p className="mt-1 text-red-500 text-sm">{errors.budget}</p>
        )}
      </div>

      {/* Existing Files Section */}
      {formData.existingFiles && formData.existingFiles.length > 0 && (
        <div>
          <Label>Current Documents</Label>
          <div className="mt-2 space-y-2">
            {formData.existingFiles?.map((file) => (
              <div
                className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-3"
                key={file.id}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-foreground text-sm">
                      {file.originalFilename}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatFileSize(file.fileSize)} • Uploaded{' '}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  className="h-8 w-8 flex-shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={loading}
                  onClick={() => onRemoveExistingFile(file.id)}
                  size="sm"
                  title={`Remove ${file.originalFilename}`}
                  type="button"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New File Upload Section */}
      <div>
        <Label htmlFor="project-files">
          {formData.existingFiles && formData.existingFiles.length > 0
            ? 'Add New Documents (Optional)'
            : 'Project Documents (Optional)'}
        </Label>
        <Input
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip,.rar"
          className="file:border-0 file:bg-transparent file:font-medium file:text-sm"
          disabled={loading}
          id="project-files"
          multiple
          onChange={(e) => onPickFiles(e.currentTarget.files)}
          type="file"
        />

        {/* New Files Preview */}
        <div className="mt-2 space-y-2">
          {formData.files.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No new files selected
            </p>
          ) : (
            <div className="max-h-32 space-y-1 overflow-y-auto">
              <p className="font-medium text-blue-700 text-sm">
                {formData.files.length} new file
                {formData.files.length !== 1 ? 's' : ''} selected:
              </p>
              {formData.files?.map((f, idx) => (
                <div
                  className="flex items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 p-2"
                  key={`${f.name}-${f.size}-${idx}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-blue-600" />
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-foreground text-sm">
                        {f.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatFileSize(f.size)} • New file
                      </span>
                    </div>
                  </div>
                  <Button
                    className="h-8 w-8 flex-shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={loading}
                    onClick={() => removeFileAt(idx)}
                    size="sm"
                    title={`Remove ${f.name}`}
                    type="button"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
