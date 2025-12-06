'use client';

import { Building2, Edit, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import OrganisationForm from '@/components/settings/organisation/organisation-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import type { Organisation } from '@/types/organisation';

export default function OrganisationPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [deleteOrgId, setDeleteOrgId] = useState<string>('');
  const router = useRouter();
  const { hasPermission: hasPermissionCheck } = useAuth();

  const checkPermission = useCallback(() => {
    const response = hasPermissionCheck('SETTINGS-ORGANISATION-MANAGEMENT');

    if (response) {
      setHasPermission(true);
    } else {
      router.replace('/dashboard');
    }
  }, [router, hasPermissionCheck]);

  const fetchOrganisations = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await api.get('/api/organisation');

      if (!(result.success && result.data)) {
        toast.error(result.message || 'Failed to load organisations');
        return;
      }

      const orgsData = Array.isArray(result.data) ? result.data : [result.data];
      setOrganisations(orgsData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load organisations'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    fetchOrganisations();
  }, [fetchOrganisations]);

  const handleCreate = () => {
    setSelectedOrg(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (org: Organisation) => {
    setSelectedOrg(org);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (orgId: string) => {
    setDeleteOrgId(orgId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const { data: result } = await api.delete(
        `/api/organisation/${deleteOrgId}`
      );

      if (result.success) {
        toast.success('Organisation deleted successfully');
        setOrganisations(organisations.filter((org) => org.id !== deleteOrgId));
        setIsDeleteDialogOpen(false);
        setDeleteOrgId('');
      } else {
        toast.error(result.message || 'Failed to delete organisation');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete organisation'
      );
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
      if (selectedOrg) {
        // Update existing organisation
        const { data: result } = await api.put('/api/organisation', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (result.success) {
          toast.success('Organisation updated successfully');
          fetchOrganisations();
          setIsDialogOpen(false);
        } else {
          toast.error(result.message || 'Failed to update organisation');
        }
      } else {
        // Create new organisation
        const { data: result } = await api.post('/api/organisation', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (result.success) {
          toast.success('Organisation created successfully');
          fetchOrganisations();
          setIsDialogOpen(false);
        } else {
          toast.error(result.message || 'Failed to create organisation');
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save organisation'
      );
    }
  };

  if (!hasPermission) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="font-bold text-2xl">Organisations</h1>
          <span className="text-muted-foreground text-sm">
            Manage your organisations and their settings
          </span>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add <span className="hidden md:inline">Organisation</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organisations</CardTitle>
          <CardDescription>
            View and manage all organisations in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3]?.map((i) => (
                <div
                  className="h-16 w-full animate-pulse rounded bg-gray-200"
                  key={i}
                />
              ))}
            </div>
          )}

          {!isLoading && organisations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">
                No organisations found
              </h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Get started by creating your first organisation
              </p>
              <Button onClick={handleCreate} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Organisation
              </Button>
            </div>
          )}

          {!isLoading && organisations.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Casual Leave</TableHead>
                  <TableHead>Sick Leave</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organisations?.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="flex items-center gap-2 font-medium">
                      <Image
                        alt={org.title}
                        className="rounded-full"
                        height={25}
                        src={org.image || ''}
                        width={25}
                      />{' '}
                      {org.title}
                    </TableCell>
                    <TableCell>{org.email || 'N/A'}</TableCell>
                    <TableCell>{org.yearlyCasualLeave || 'N/A'}</TableCell>
                    <TableCell>{org.yearlySickLeave || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEdit(org)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(org.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg ? 'Edit Organisation' : 'Create Organisation'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrg
                ? 'Update the organisation details below'
                : 'Fill in the details to create a new organisation'}
            </DialogDescription>
          </DialogHeader>
          <OrganisationForm
            onCancel={() => setIsDialogOpen(false)}
            onSave={handleSave}
            organisation={selectedOrg}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organisation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this organisation? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
