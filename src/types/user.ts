export type ChangePasswordValues = {
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordFormProps = {
  onCancel?: () => void;
  className?: string;
  userId: string;
};

export interface DataRow {
  id: string;
  empId?: string;
  image?: string;
  name: string;
  role: string;
  email: string;
  phoneNumber: string;
  banned: boolean;
  createdAt: string;
}

export interface UserWithRoleExtend {
  id: string;
  empId?: string;
  image?: string;
  name: string;
  role: string;
  email: string;
  phoneNumber: string;
  banned: boolean;
  createdAt: string;
}

// export type Role =
//   | "admin"
//   | "manager"
//   | "owner"
//   | "employee"
//   | "workingOwner"
//   | "workingManager"
//   | "vendor";

export type ProfileDetails = {
  name: string;
  email: string;
  phone: string;
  role: RoleOption;
  organisationId?: string;
};

export type ProfileDetailsFormProps = {
  userId: string;
  onSave?: (values: ProfileDetails) => void;
  onCancel?: () => void;
  className?: string;
};

export const DEFAULT_VALUES: ProfileDetails = {
  name: '',
  email: '',
  phone: '',
  role: {
    id: '',
    name: '',
    value: '',
  },
  organisationId: undefined,
};

export interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  totalUsers: number;
  totalPages: number;
  query: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export type InviteFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: RoleOption;
  phoneNumber: string;
  photoFile?: string | File;
  organisationId?: string;
};

export type InviteUserDialogProps = {
  trigger?: React.ReactNode;
  defaultRole?: RoleOption;
  onSubmit?: (values: InviteFormValues) => Promise<void> | void;
  submittingText?: string;
  submitText?: string;
};

export type AvatarSectionProps = {
  onChange?: (file: File, previewUrl: string) => void;
  className?: string;
  initialUrl?: string;
  userId: string;
};

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}

export interface NotificationPrefs {
  email: boolean;
  push: boolean;
  app: boolean;
}

export interface ChangePasswordValuesOfUser {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileDetailsWithoutRole {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface RoleType {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleOption {
  id: string;
  name: string;
  value: string;
}

export interface RoleComboboxProps {
  value: RoleOption;
  onValueChange: (value: RoleOption) => void;
  rolesPerPage?: number;
  disabled?: boolean;
  placeholder?: string;
  dialogOpen: boolean;
}
