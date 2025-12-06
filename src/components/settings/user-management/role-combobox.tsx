'use client';

import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { RoleComboboxProps, RoleOption, RoleType } from '@/types/user';
import { formatRoleName } from '@/utils/format-role-name';

export function RoleCombobox({
  value,
  dialogOpen,
  onValueChange,
  rolesPerPage = 10,
  disabled = false,
  placeholder = 'Select a role',
}: RoleComboboxProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [search, setSearch] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedRef = useRef<boolean>(false);

  const fetchRoles = useCallback(
    async (
      searchTerm: string,
      limit: number,
      currentOffset: number,
      append = false
    ) => {
      try {
        setIsLoading(true);
        const { data: result } = await api.get('/api/role-permissions', {
          params: {
            search: searchTerm,
            limit,
            offset: currentOffset,
          },
        });

        if (!(result.success && result.data)) {
          toast.error(result.message || 'Failed to load roles');
          return;
        }

        const newRoles = result.data.roles?.map((role: RoleType) => ({
          id: role.id,
          name: role.name,
          value: role.name,
        }));

        setRoles((prev) => (append ? [...prev, ...newRoles] : newRoles));
        setHasMore(newRoles.length === limit);

        // Auto-select the first role if no value is set and we're not appending
        if (!append && newRoles.length > 0 && !value?.id) {
          onValueChange(newRoles[0]);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load roles'
        );
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    },
    [value, onValueChange]
  );

  useEffect(() => {
    if (dialogOpen && !hasFetchedRef.current) {
      fetchRoles('', rolesPerPage, 0, false);
      hasFetchedRef.current = true;
    }
  }, [dialogOpen, fetchRoles, rolesPerPage]);

  // Reset when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      hasFetchedRef.current = false;
      setRoles([]);
      setSearch('');
      setOffset(0);
      setIsInitialLoad(true);
    }
  }, [dialogOpen]);

  const debouncedFetchRoles = useCallback(
    (searchTerm: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setOffset(0);
        fetchRoles(searchTerm, rolesPerPage, 0, false);
      }, 300);
    },
    [fetchRoles, rolesPerPage]
  );

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
    debouncedFetchRoles(searchValue);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const newOffset = offset + rolesPerPage;
      setOffset(newOffset);
      fetchRoles(search, rolesPerPage, newOffset, true);
    }
  };

  useEffect(() => {
    if (open && roles.length === 0 && !isLoading) {
      fetchRoles('', rolesPerPage, 0, false);
    }
  }, [open, fetchRoles, roles.length, rolesPerPage, isLoading]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const selectedRole = roles.find((role) => role.id === value?.id);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'w-full justify-between',
            !value?.id && 'text-muted-foreground'
          )}
          disabled={disabled || isInitialLoad}
          type="button"
          variant="outline"
        >
          {isInitialLoad ? (
            <>
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading roles...</span>
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          ) : (
            <>
              <span className="flex items-center gap-2 truncate">
                {formatRoleName(
                  selectedRole?.name || value?.name || placeholder
                )}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-full p-0">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onValueChange={handleSearchChange}
              placeholder="Search roles..."
              value={search}
            />
          </div>
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              {isInitialLoad && (
                <div className="space-y-2 px-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}
              {!isInitialLoad && isLoading && roles.length === 0 && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading roles...</p>
                </div>
              )}
              {!(isInitialLoad || isLoading) && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="rounded-full bg-muted p-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">No roles found</p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {search
                        ? `No results for "${search}"`
                        : 'No roles available'}
                    </p>
                  </div>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {roles?.map((role) => (
                <CommandItem
                  className="cursor-pointer"
                  key={role.id}
                  onSelect={() => {
                    onValueChange(role);
                    setOpen(false);
                  }}
                  value={role.value}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value?.id === role.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1 truncate">
                    {formatRoleName(role.name)}
                  </span>
                </CommandItem>
              ))}
              {hasMore && !isLoading && roles.length > 0 && (
                <CommandItem
                  className="cursor-pointer justify-center text-muted-foreground hover:text-foreground"
                  onSelect={handleLoadMore}
                >
                  <span className="text-sm">Load more...</span>
                </CommandItem>
              )}
              {isLoading && roles.length > 0 && (
                <CommandItem
                  className="pointer-events-none justify-center"
                  disabled
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    Loading...
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
