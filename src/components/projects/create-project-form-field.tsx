import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  formData: {
    title: string;
    description: string;
    budget: string;
    files: File[];
  };
  errors: Record<string, string>;
  loading?: boolean;
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      budget: string;
      userId: string;
      assignedManagersId: string[];
      files: File[];
    }>
  >;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function ProjectFormFields({
  formData,
  errors,
  loading = false,
  setFormData,
  setErrors,
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

  // Remove file at specific index
  const removeFileAt = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
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

      {/* File upload section */}
      <div>
        <Label htmlFor="project-files">Project Documents (Optional)</Label>
        <Input
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip,.rar"
          className="file:border-0 file:bg-transparent file:font-medium file:text-sm"
          disabled={loading}
          id="project-files"
          multiple
          onChange={(e) => onPickFiles(e.currentTarget.files)}
          type="file"
        />

        <div className="mt-2 space-y-2">
          {formData.files.length === 0 ? (
            <p className="text-muted-foreground text-sm">No files selected</p>
          ) : (
            <div className="max-h-32 space-y-1 overflow-y-auto">
              <p className="font-medium text-sm">
                {formData.files.length} file
                {formData.files.length !== 1 ? 's' : ''} selected:
              </p>
              {formData.files?.map((f, idx) => (
                <div
                  className="flex items-center justify-between gap-2 rounded-md bg-muted p-2"
                  key={`${f.name}-${f.size}-${idx}`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-foreground text-sm">
                      {f.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <Button
                    disabled={loading}
                    onClick={() => removeFileAt(idx)}
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
      </div>
    </>
  );
}
