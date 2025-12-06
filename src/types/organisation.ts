export interface Organisation {
  id: string;
  title: string;
  image: string;
  email?: string;
  yearlyCasualLeave?: string;
  yearlySickLeave?: string;
  ipAddresses?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganisationFormData {
  title: string;
  email: string;
  image: File | null;
  yearlyCasualLeave?: string;
  yearlySickLeave?: string;
  ipAddresses?: string[];
}

export interface OrganisationFormProps {
  organisation: Organisation | null;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export interface IpAddressManagerProps {
  ipAddresses: string[];
  isLoadingIp: boolean;
  onGetCurrentIp: () => Promise<void>;
  onRemoveIp: (index: number) => void;
  onAddIp: (ip: string) => void;
  onUpdateIp: (index: number, ip: string) => void;
}

export interface ImageUploadProps {
  previewUrl: string;
  error?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export interface FormInputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
