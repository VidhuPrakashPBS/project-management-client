import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { User } from '@/types/user';

/**
 * Hook to fetch project data, including managers and owners.
 * Returns an object containing the current list of managers and owners,
 * as well as loading states for each, and callbacks to fetch the data.
 * @returns {{
 *   managers: User[],
 *   owners: User[],
 *   loadingManagers: boolean,
 *   loadingOwners: boolean,
 *   fetchManagers: () => Promise<void>,
 *   fetchOwners: () => Promise<void>
 * }}
 */
export const useProjectData = () => {
  const [managers, setManagers] = useState<User[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const fetchManagers = useCallback(async () => {
    try {
      setLoadingManagers(true);
      const response = await api.get('/api/employee/managers');
      setManagers(response.data.data || response.data);
    } catch (error) {
      toast.error(`Failed to load managers ${error}`);
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    try {
      setLoadingOwners(true);
      const response = await api.get('/api/employee/owners');
      setOwners(response.data.data || response.data);
    } catch (error) {
      toast.error(`Failed to load owners ${error}`);
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  }, []);

  return {
    managers,
    owners,
    loadingManagers,
    loadingOwners,
    fetchManagers,
    fetchOwners,
  };
};
