'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type {
  OrganisationFormData,
  OrganisationFormProps,
} from '@/types/organisation';
import FormInput from './form-input';
import ImageUpload from './image-upload';
import IpAddressManager from './ip-address-manager';

const IPV4_REGEX =
  /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const isValidIpAddress = (ip: string): boolean => {
  return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
};

export const validateTitle = (title: string): string | null => {
  if (!title.trim()) {
    return 'Title is required';
  }
  if (title.trim().length < 2) {
    return 'Title must be at least 2 characters';
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email address';
  }
  return null;
};

export const validateLeave = (leave: string): string | null => {
  if (!leave) {
    return null;
  }
  const leaveValue = Number(leave);
  if (leaveValue < 0) {
    return 'Cannot be negative';
  }
  if (leaveValue > 365) {
    return 'Cannot exceed 365 days';
  }
  return null;
};

export default function OrganisationForm({
  organisation,
  onSave,
  onCancel,
}: OrganisationFormProps) {
  const [formData, setFormData] = useState<OrganisationFormData>({
    title: organisation?.title || '',
    email: organisation?.email || '',
    image: null,
    yearlyCasualLeave: organisation?.yearlyCasualLeave || '',
    yearlySickLeave: organisation?.yearlySickLeave || '',
    ipAddresses: organisation?.ipAddresses || [],
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    organisation?.image || ''
  );
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddIp = (ip: string) => {
    if (!ip.trim()) {
      return;
    }

    if (!isValidIpAddress(ip.trim())) {
      toast.error('Invalid IP address format (IPv4 or IPv6 required)');
      return;
    }

    if (formData.ipAddresses?.includes(ip.trim())) {
      toast.error('This IP address is already added');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      ipAddresses: [...(prev.ipAddresses || []), ip.trim()],
    }));
  };

  const handleUpdateIp = (index: number, ip: string) => {
    if (!ip.trim()) {
      // Remove if empty
      handleRemoveIpAddress(index);
      return;
    }

    if (!isValidIpAddress(ip.trim())) {
      return;
    }

    setFormData((prev) => {
      const newIpAddresses = [...(prev.ipAddresses || [])];
      newIpAddresses[index] = ip.trim();
      return {
        ...prev,
        ipAddresses: newIpAddresses,
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const titleError = validateTitle(formData.title);
    if (titleError) {
      newErrors.title = titleError;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const casualLeaveError = validateLeave(formData.yearlyCasualLeave || '');
    if (casualLeaveError) {
      newErrors.yearlyCasualLeave = casualLeaveError;
    }

    const sickLeaveError = validateLeave(formData.yearlySickLeave || '');
    if (sickLeaveError) {
      newErrors.yearlySickLeave = sickLeaveError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildFormData = (): FormData => {
    const submitData = new FormData();
    submitData.append('title', formData.title.trim());
    submitData.append('email', formData.email.trim());

    if (selectedFile) {
      submitData.append('image', selectedFile);
    }
    if (formData.yearlyCasualLeave) {
      submitData.append('yearlyCasualLeave', formData.yearlyCasualLeave);
    }
    if (formData.yearlySickLeave) {
      submitData.append('yearlySickLeave', formData.yearlySickLeave);
    }

    formData.ipAddresses?.forEach((ip, index) => {
      submitData.append(`ipAddress[${index}]`, ip);
    });

    if (organisation?.id) {
      submitData.append('id', organisation.id);
    }
    return submitData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(buildFormData());

      // Reset form
      setFormData({
        title: '',
        email: '',
        image: null,
        yearlyCasualLeave: '',
        yearlySickLeave: '',
        ipAddresses: [],
      });
      setSelectedFile(null);
      setPreviewUrl('');
      setErrors({});
    } catch (error) {
      toast.error(`Failed to save organisation: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: 'Please select a valid image file (JPEG, PNG, GIF, WEBP)',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: 'File size must be less than 5MB',
      }));
      return;
    }

    setSelectedFile(file);
    setFormData((prev) => ({ ...prev, image: file }));

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    setErrors((prev) => ({ ...prev, image: '' }));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(organisation?.image || '');
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleGetCurrentIp = async () => {
    try {
      setIsLoadingIp(true);
      const { data: result } = await api.get('/api/common/get-ip-address');
      if (!(result.success && result.ip)) {
        toast.success(result.message || 'Failed to fetch IP address');
        return;
      }

      const fetchedIp = result.ip;

      if (!isValidIpAddress(fetchedIp)) {
        toast.error('Fetched IP address is not valid (IPv4 or IPv6 required)');
        return;
      }

      if (formData.ipAddresses?.includes(fetchedIp)) {
        toast.error('This IP address is already added');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        ipAddresses: [...(prev.ipAddresses || []), fetchedIp],
      }));

      toast.success(`IP address ${fetchedIp} added successfully`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch current IP address'
      );
    } finally {
      setIsLoadingIp(false);
    }
  };

  const handleRemoveIpAddress = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ipAddresses: prev.ipAddresses?.filter((_, i) => i !== index) || [],
    }));
    toast.success('IP address removed');
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormInput
        error={errors.title}
        id="title"
        label="Title"
        name="title"
        onChange={handleInputChange}
        placeholder="Enter organisation title"
        required
        value={formData.title}
      />

      <FormInput
        error={errors.email}
        id="email"
        label="Email"
        name="email"
        onChange={handleInputChange}
        placeholder="organisation@example.com"
        required
        type="email"
        value={formData.email}
      />

      <ImageUpload
        error={errors.image}
        onFileChange={handleFileChange}
        onRemove={handleRemoveImage}
        previewUrl={previewUrl}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          error={errors.yearlyCasualLeave}
          id="yearlyCasualLeave"
          label="Yearly Casual Leave"
          max="365"
          min="0"
          name="yearlyCasualLeave"
          onChange={handleInputChange}
          placeholder="12"
          type="number"
          value={formData.yearlyCasualLeave || ''}
        />

        <FormInput
          error={errors.yearlySickLeave}
          id="yearlySickLeave"
          label="Yearly Sick Leave"
          max="365"
          min="0"
          name="yearlySickLeave"
          onChange={handleInputChange}
          placeholder="10"
          type="number"
          value={formData.yearlySickLeave || ''}
        />
      </div>

      <IpAddressManager
        ipAddresses={formData.ipAddresses || []}
        isLoadingIp={isLoadingIp}
        onAddIp={handleAddIp}
        onGetCurrentIp={handleGetCurrentIp}
        onRemoveIp={handleRemoveIpAddress}
        onUpdateIp={handleUpdateIp}
      />

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {organisation ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
