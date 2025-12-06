'use client';

import { Calendar, Clock, Edit, Paperclip, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type {
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  PreviousLeaveRequestsProps,
} from '@/types/leave-management';

import DeleteLeaveDialog from './delete-leave-request';
import EditLeaveDialog from './edit-leave-request';

const getStatusColor = (status: LeaveStatus): string => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getTypeColor = (type: LeaveType): string => {
  switch (type) {
    case 'sick':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'casual':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'unpaid':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_LABEL: Record<LeaveStatus, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Pending',
};

const RequestHeader = ({
  type,
  status,
  createdAt,
  halfDayType,
}: {
  type: LeaveType;
  status: LeaveStatus;
  createdAt: Date | string;
  halfDayType?: 'first_half' | 'second_half';
}) => (
  <div className="flex items-start justify-between">
    <div className="flex gap-2">
      <Badge className={getTypeColor(type)}>{type}</Badge>
      {halfDayType && (
        <Badge className="bg-indigo-100 text-indigo-800">
          {halfDayType === 'first_half' ? 'First Half' : 'Second Half'}
        </Badge>
      )}
      <Badge className={getStatusColor(status)}>{STATUS_LABEL[status]}</Badge>
    </div>
    <div className="flex items-center text-muted-foreground text-sm">
      <Calendar className="mr-1 h-4 w-4" />
      {formatDate(createdAt)}
    </div>
  </div>
);

const RequestPeriod = ({
  startDate,
  endDate,
  totalDays,
  halfDayType,
}: {
  startDate: Date | string;
  endDate: Date | string;
  totalDays?: string;
  halfDayType?: 'first_half' | 'second_half';
}) => (
  <div>
    <h4 className="mb-1 font-medium">Leave Period</h4>
    <p className="text-muted-foreground text-sm">
      {formatDate(startDate)}
      {formatDate(startDate) !== formatDate(endDate) &&
        ` - ${formatDate(endDate)}`}
    </p>
    {totalDays && (
      <p className="text-muted-foreground text-xs">
        Duration: {halfDayType ? '0.5 days' : `${totalDays} days`}
      </p>
    )}
  </div>
);

const RequestApproval = ({
  status,
  approver,
  approvedAt,
}: {
  status: LeaveStatus;
  approver?: string;
  approvedAt?: Date | string;
}) => {
  if (status === 'pending' || !(approver || approvedAt)) {
    return null;
  }
  return (
    <div>
      <h4 className="mb-1 font-medium">
        {status === 'approved' ? 'Approved By' : 'Rejected By'}
      </h4>
      <div className="space-y-1">
        {approver && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <User className="h-3 w-3" />
            <span>{approver}</span>
          </div>
        )}
        {approvedAt && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="h-3 w-3" />
            <span>{formatDateTime(approvedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const RequestReason = ({ reason }: { reason: string }) => (
  <div>
    <h4 className="mb-1 font-medium">Reason</h4>
    <p className="text-muted-foreground text-sm">{reason}</p>
  </div>
);

const RequestComment = ({
  status,
  comment,
}: {
  status: LeaveStatus;
  comment?: string;
}) => {
  if (!comment) {
    return null;
  }
  const isApproved = status === 'approved';
  return (
    <div>
      <h4 className="mb-1 font-medium">
        {isApproved ? 'Approval Comment' : 'Rejection Reason'}
      </h4>
      <div
        className={`rounded-md p-3 text-sm ${
          isApproved
            ? 'border border-green-200 bg-green-50 text-green-700'
            : 'border border-red-200 bg-red-50 text-red-700'
        }`}
      >
        {comment}
      </div>
    </div>
  );
};

const RequestAttachment = ({
  files,
}: {
  files?: {
    id: string;
    url: string;
    originalFileName: string;
    fileType: string;
  }[];
}) => {
  if (!files || files.length === 0) {
    return null;
  }
  return (
    <div className="space-y-2">
      <h4 className="mb-1 font-medium">Attachments</h4>
      {files?.map((file) => (
        <a
          className="flex items-center gap-2 text-blue-600 text-sm hover:underline"
          href={file.url}
          key={file.id}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Paperclip className="h-4 w-4" />
          <span>{file.originalFileName}</span>
        </a>
      ))}
    </div>
  );
};

const RequestPending = ({ status }: { status: LeaveStatus }) => {
  if (status !== 'pending') {
    return null;
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-600">
      <Clock className="h-4 w-4" />
      <span>Awaiting approval from management</span>
    </div>
  );
};

const RequestActions = ({
  request,
  onEdit,
  onDelete,
}: {
  request: LeaveRequest;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  // Only show actions for pending requests
  if (request.status !== 'pending') {
    return null;
  }

  return (
    <div className="flex justify-end gap-2 border-t pt-3">
      <Button
        className="gap-1"
        onClick={onEdit}
        size="sm"
        type="button"
        variant="outline"
      >
        <Edit className="h-4 w-4" />
        Edit
      </Button>
      <Button
        className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={onDelete}
        size="sm"
        type="button"
        variant="outline"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
};

const RequestCard = ({
  request,
  onEdit,
  onDelete,
}: {
  request: LeaveRequest;
  onEdit: (request: LeaveRequest) => void;
  onDelete: (request: LeaveRequest) => void;
}) => (
  <div className="space-y-3 rounded-lg border p-4">
    <RequestHeader
      createdAt={request.createdAt}
      halfDayType={request.halfDayType}
      status={request.status}
      type={request.leaveType}
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <RequestPeriod
        endDate={request.endDate}
        halfDayType={request.halfDayType}
        startDate={request.startDate}
        totalDays={request.totalDays}
      />
      <RequestApproval
        approvedAt={request.actionAt}
        approver={request.actionBy}
        status={request.status}
      />
    </div>
    <RequestReason reason={request.reason} />
    <RequestComment comment={request.actionComments} status={request.status} />
    <RequestAttachment files={request.files} />
    <RequestPending status={request.status} />
    <RequestActions
      onDelete={() => onDelete(request)}
      onEdit={() => onEdit(request)}
      request={request}
    />
  </div>
);

const PreviousLeaveRequests = ({ refetch }: PreviousLeaveRequestsProps) => {
  const { data: session } = authClient.useSession();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );

  const ITEMS_PER_PAGE = 5;

  const updateLoadingState = useCallback((append: boolean): void => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
  }, []);

  const updateRequestsState = useCallback(
    (newRequests: LeaveRequest[], append: boolean): void => {
      if (append) {
        setRequests((prev) => [...prev, ...newRequests]);
      } else {
        setRequests(newRequests);
      }
      setHasMore(newRequests.length === ITEMS_PER_PAGE);
    },
    []
  );

  const fetchLeaveRequests = useCallback(
    async (page: number, append = false): Promise<void> => {
      if (!session?.user?.id) {
        return;
      }

      updateLoadingState(append);

      try {
        const userData = await api.get(`/api/user/${session?.user.id}`);

        if (
          !(session?.user?.id && userData.data?.data?.data[0].organisationId)
        ) {
          toast.error('User session not found. Please login again.');
          return;
        }

        const response = await api.get('/api/leave', {
          params: {
            employeeId: session.user.id,
            organisationId: userData.data?.data?.data[0].organisationId,
            sortBy: 'createdAt',
            order: 'desc',
            limit: ITEMS_PER_PAGE,
            page,
          },
        });

        if (response.data.success) {
          updateRequestsState(response.data.data, append);
        } else {
          throw new Error(
            response.data.message || 'Failed to fetch leave requests'
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [session?.user?.id, updateLoadingState, updateRequestsState]
  );

  const handleLoadMore = (): void => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchLeaveRequests(nextPage, true);
  };

  const handleEditClick = (request: LeaveRequest): void => {
    setSelectedRequest(request);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (request: LeaveRequest): void => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };

  const handleSuccess = (): void => {
    setCurrentPage(1);
    setHasMore(true);
    fetchLeaveRequests(1, false);
  };

  useEffect(() => {
    if (refetch >= 0) {
      setCurrentPage(1);
      setHasMore(true);
      fetchLeaveRequests(1, false);
    }
  }, [fetchLeaveRequests, refetch]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Previous Leave Requests</CardTitle>
          <CardDescription>
            View your leave request history and current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 animate-spin text-gray-300" />
              <p className="text-muted-foreground">Loading leave requests...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Previous Leave Requests</CardTitle>
          <CardDescription>
            View your leave request history and current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button
              className="mt-4"
              onClick={() => fetchLeaveRequests(1, false)}
              type="button"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Previous Leave Requests</CardTitle>
          <CardDescription>
            View your leave request history and current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No leave requests found
            </div>
          ) : (
            <div className="space-y-4">
              {requests?.map((request) => (
                <RequestCard
                  key={request.id}
                  onDelete={handleDeleteClick}
                  onEdit={handleEditClick}
                  request={request}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    className="w-full sm:w-auto"
                    disabled={isLoadingMore}
                    onClick={handleLoadMore}
                    type="button"
                    variant="outline"
                  >
                    {isLoadingMore ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}

              {!hasMore && requests.length > 0 && (
                <div className="py-4 text-center text-muted-foreground text-sm">
                  No more leave requests to display
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <>
          <EditLeaveDialog
            leaveRequestId={selectedRequest.id}
            onOpenChange={setEditDialogOpen}
            onSuccess={handleSuccess}
            open={editDialogOpen}
          />
          <DeleteLeaveDialog
            leaveId={selectedRequest.id}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={handleSuccess}
            open={deleteDialogOpen}
          />
        </>
      )}
    </>
  );
};

export default PreviousLeaveRequests;
