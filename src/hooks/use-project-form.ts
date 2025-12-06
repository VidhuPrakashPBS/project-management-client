import { useState } from 'react';

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const useProjectForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    userId: '',
    assignedManagersId: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      budget: '',
      userId: '',
      assignedManagersId: [],
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (adminCreate: boolean) => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.budget.trim()) {
      newErrors.budget = 'Budget is required';
    }

    if (adminCreate && !formData.userId.trim()) {
      newErrors.ownerId = 'Owner is required';
    }

    if (formData.userId.trim() && !uuidRegex.test(formData.userId)) {
      newErrors.userId = 'Please enter a valid UUID';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    resetForm,
    handleInputChange,
    validateForm,
  };
};
