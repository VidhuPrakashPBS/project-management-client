import type { SubTaskView } from '@/types/main-task';

/**
 * Maps a task status to a SubTaskView status
 *
 * @param {string} status - Task status
 * @returns {SubTaskView['status']} - SubTaskView status
 */
export function mapTaskStatusToView(status: string): SubTaskView['status'] {
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '-');

  switch (normalizedStatus) {
    case 'completed':
      return 'completed';
    case 'in-progress':
    case 'in_progress':
      return 'in-progress';
    case 'on-hold':
    case 'on_hold':
      return 'on-hold';
    case 'due':
      return 'due';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

/**
 * Returns a set of CSS classes based on the given SubTaskView status
 *
 * The returned object contains the following properties:
 * - `text`: The text color for the status text
 * - `dot`: The background color for the status dot
 * - `chip`: The background and border color for the status chip
 *
 * @param {SubTaskView["status"]} s - The SubTaskView status
 * @returns {Object} - An object containing CSS classes for the status
 */
export function statusStyles(s: SubTaskView['status']) {
  switch (s) {
    case 'completed':
      return {
        text: 'Completed',
        dot: 'bg-emerald-500',
        chip: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    case 'in-progress':
      return {
        text: 'In Progress',
        dot: 'bg-blue-500',
        chip: 'text-blue-700 bg-blue-50 border-blue-200',
      };
    case 'on-hold':
      return {
        text: 'On Hold',
        dot: 'bg-amber-500',
        chip: 'text-amber-700 bg-amber-50 border-amber-200',
      };
    case 'due':
      return {
        text: 'Due',
        dot: 'bg-red-500',
        chip: 'text-red-700 bg-red-50 border-red-200',
      };
    default:
      return {
        text: 'Pending',
        dot: 'bg-slate-400',
        chip: 'text-slate-700 bg-slate-50 border-slate-200',
      };
  }
}
