import {
  Calendar,
  Check,
  Clock,
  MessageSquare,
  Paperclip,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { LeaveRequest } from '@/types/leave-management';

const AdminLeaveRequest = ({ actionControl }: { actionControl: boolean }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [comment, setComment] = useState<string>('');
  const [actionType, setActionType] = useState<'allow' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchLeaveRequests = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authClient.getSession();
      const userData = await api.get(`/api/user/${session.data?.user.id}`);

      const queryParams = new URLSearchParams({
        sortBy: 'createdAt',
        order: 'asc',
        limit: '50',
        page: '1',
      });

      // Add organisationId only if user is not admin and has organisationId
      if (
        userData.data?.data?.data[0].role !== 'admin' &&
        userData.data?.data?.data[0].organisationId
      ) {
        queryParams.append(
          'organisationId',
          userData.data?.data?.data[0].organisationId
        );
      }

      const response = await api.get(`/api/leave?${queryParams.toString()}`);

      if (!response) {
        throw new Error('Failed to fetch leave requests');
      }

      const result = response.data;

      if (result.success) {
        setRequests(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch leave requests');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  /**
   * Returns a CSS class string representing the color based on the given status.
   * @param {LeaveRequest['status']} status - The status of the leave request.
   * @returns {string} - A CSS class string representing the color of the given status.
   * @example getStatusColor('approved') // returns 'bg-green-100 text-green-800 hover:bg-green-200'
   */
  const getStatusColor = (status: LeaveRequest['status']): string => {
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

  /**
   * Returns a CSS class string representing the color based on the given type.
   * @param {LeaveRequest['type']} type - The type of the leave request.
   * @returns {string} - A CSS class string representing the color of the given type.
   * @example getTypeColor('sick') // returns 'bg-blue-100 text-blue-800 hover:bg-blue-200'
   */
  const getTypeColor = (type: LeaveRequest['leaveType']): string => {
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

  /**
   * Converts a date object to a human-readable date string in the format of "Month Day, Year".
   * @param {Date} date - The date object to convert.
   * @returns {string} - The human-readable date string.
   * @example formatDate(new Date('2022-09-01')) // returns 'Sep 1, 2022'
   */
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Calculates the number of days between the given start and end dates.
   * @param {Date} startDate - The start date.
   * @param {Date} endDate - The end date.
   * @returns {number} - The number of days between the given start and end dates.
   * @example calculateDays(new Date('2022-09-01'), new Date('2022-09-05')) // returns 5
   */
  const calculateDays = (
    startDate: Date | string,
    endDate: Date | string
  ): number => {
    const start =
      typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  /**
   * Handles an action on a leave request.
   * Sets the selected request to the given request,
   * sets the action type to the given action,
   * and resets the comment to an empty string.
   * @param {LeaveRequest} request - The leave request to action on.
   * @param {'allow' | 'reject'} action - The action to perform on the request.
   */
  const handleAction = (
    request: LeaveRequest,
    action: 'allow' | 'reject'
  ): void => {
    setSelectedRequest(request);
    setActionType(action);
    setComment('');
  };

  /**
   * Builds the request payload for leave request updates.
   * @param {string} id - The leave request id.
   * @param {string} userId - The user id performing the action.
   * @param {string} [comment] - Optional comment.
   * @param {'allow' | 'reject'} status - The action status.
   * @returns {object} - The request payload.
   */
  const buildRequestPayload = (
    id: string,
    userId: string,
    cmt: string | undefined,
    status: 'allow' | 'reject'
  ) => ({
    id,
    ...(status === 'allow' ? { approverId: userId } : { rejectorId: userId }),
    comment: cmt || undefined,
  });

  /**
   * Makes the API call to update a leave request.
   * @param {'allow' | 'reject'} status - The action status.
   * @param {object} payload - The request payload.
   * @returns {Promise<any>} - The API response.
   */
  const makeUpdateRequest = (status: 'allow' | 'reject', payload: object) => {
    const endpoint =
      status === 'allow' ? '/api/leave/approve' : '/api/leave/reject';
    return api.post(endpoint, payload);
  };

  /**
   * Updates a leave request.
   * @param {string} id - The id of the leave request to update.
   * @param {'allow' | 'reject'} status - The status to update the leave request to.
   * @param {string} [cmt] - The comment to update the leave request with.
   * @returns {Promise<void>} - Resolves when the update is successful, rejects otherwise.
   * @throws {Error} - If the update fails.
   */
  const handleUpdateRequest = async (
    id: string,
    status: 'allow' | 'reject',
    cmt?: string
  ): Promise<void> => {
    setIsSubmitting(true);

    try {
      const session = await authClient.getSession();
      const payload = buildRequestPayload(
        id,
        session.data?.user.id as string,
        cmt,
        status
      );

      const response = await makeUpdateRequest(status, payload);

      if (response.data.success) {
        toast.success(
          `Leave request ${status === 'allow' ? 'approved' : 'rejected'} successfully`
        );
        await fetchLeaveRequests();
      } else {
        throw new Error(
          response.data.message || 'Failed to update leave request'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Submits an action on a leave request.
   * If a request is selected and an action type is set,
   * calls `onUpdateRequest` with the selected request's id,
   * the action type, and the trimmed comment.
   * Resets the selected request, action type, and comment to their default values.
   */
  const handleSubmitAction = async (): Promise<void> => {
    if (selectedRequest && actionType) {
      await handleUpdateRequest(
        selectedRequest.id,
        actionType,
        comment.trim() || undefined
      );
      setSelectedRequest(null);
      setActionType(null);
      setComment('');
    }
  };

  const pendingRequests = requests.filter((req) => req.status === 'pending');
  const processedRequests = requests.filter((req) => req.status !== 'pending');

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <X className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600">{error}</p>
          <Button
            className="mt-4"
            onClick={() => fetchLeaveRequests()}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 animate-spin text-gray-300" />
          <p className="text-muted-foreground">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Leave Requests
              </CardTitle>
              <CardDescription>
                Review and approve or reject employee leave requests
              </CardDescription>
            </div>
            <Badge
              className="self-start bg-yellow-100 text-yellow-800 sm:self-auto"
              variant="secondary"
            >
              {pendingRequests.length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No pending leave requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests?.map((request) => (
                <div
                  className="space-y-4 rounded-lg border p-4 sm:p-6"
                  key={request.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.userImage} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">
                          {request.userName}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Submitted on {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getTypeColor(request.leaveType)}>
                        {request.leaveType}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <Label className="font-medium text-sm">
                        Leave Period
                      </Label>
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="break-words text-sm">
                            {formatDate(request.startDate)} -{' '}
                            {formatDate(request.endDate)}
                          </span>
                        </div>
                        <Badge className="w-fit" variant="outline">
                          {calculateDays(request.startDate, request.endDate)}{' '}
                          days
                        </Badge>
                      </div>
                    </div>

                    {request.files && request.files.length > 0 && (
                      <div>
                        <Label className="font-medium text-sm">
                          Attachments
                        </Label>
                        <div className="mt-1 space-y-2">
                          {request.files?.map((file) => (
                            <div
                              className="flex min-w-0 items-center gap-2"
                              key={file.id}
                            >
                              <Paperclip className="h-4 w-4 flex-shrink-0 text-blue-600" />
                              <span className="cursor-pointer truncate text-blue-600 text-sm hover:underline">
                                {file.originalFileName}
                              </span>
                              <Badge
                                className="flex-shrink-0 text-xs"
                                variant="outline"
                              >
                                {file.fileType}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-medium text-sm">Reason</Label>
                    <p className="mt-1 break-words rounded-md bg-gray-50 p-3 text-muted-foreground text-sm">
                      {request.reason}
                    </p>
                  </div>
                  {actionControl && (
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                            onClick={() => handleAction(request, 'allow')}
                            size="sm"
                            variant="default"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="mx-4 max-w-md sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Approve Leave Request</DialogTitle>
                            <DialogDescription>
                              You are about to approve this leave request. Add a
                              comment if needed.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="comment">
                                Comment (Optional)
                              </Label>
                              <Textarea
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment for the employee..."
                                rows={3}
                                value={comment}
                              />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                              <Button
                                className="w-full sm:w-auto"
                                onClick={() => setSelectedRequest(null)}
                                variant="outline"
                              >
                                Cancel
                              </Button>
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                                disabled={!comment.trim() || isSubmitting}
                                onClick={handleSubmitAction}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                {isSubmitting
                                  ? 'Approving...'
                                  : 'Approve Request'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full sm:w-auto"
                            onClick={() => handleAction(request, 'reject')}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="mx-4 max-w-md sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Reject Leave Request</DialogTitle>
                            <DialogDescription>
                              You are about to reject this leave request. Please
                              provide a reason.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="reject-comment">
                                Reason for Rejection *
                              </Label>
                              <Textarea
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Please explain why this request is being rejected..."
                                required
                                rows={3}
                                value={comment}
                              />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                              <Button
                                className="w-full sm:w-auto"
                                onClick={() => setSelectedRequest(null)}
                                variant="outline"
                              >
                                Cancel
                              </Button>
                              <Button
                                className="w-full sm:w-auto"
                                disabled={!comment.trim() || isSubmitting}
                                onClick={handleSubmitAction}
                                variant="destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                {isSubmitting
                                  ? 'Rejecting...'
                                  : 'Reject Request'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            Recent Decisions
          </CardTitle>
          <CardDescription>
            Previously approved or rejected leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No processed requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processedRequests.slice(0, 5)?.map((request) => (
                <div
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={request.id}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={request.userImage} />
                      <AvatarFallback className="text-xs">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">
                        {request.userName}
                      </p>
                      <p className="break-words text-muted-foreground text-xs">
                        {request.reason}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(request.startDate)} -{' '}
                        {formatDate(request.endDate)} (
                        {calculateDays(request.startDate, request.endDate)}{' '}
                        days)
                      </p>
                      <p className="break-words text-muted-foreground text-xs">
                        Decision made by {request.actionBy} on{' '}
                        {formatDate(request.actionAt as Date)}
                      </p>
                      <p className="break-words text-muted-foreground text-xs">
                        Note: {request.actionComments}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={getTypeColor(request.leaveType)}
                      variant="outline"
                    >
                      {request.leaveType}
                    </Badge>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeaveRequest;
