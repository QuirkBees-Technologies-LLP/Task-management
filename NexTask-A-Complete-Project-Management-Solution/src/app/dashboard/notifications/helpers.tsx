import {
  AssignmentInd,
  Comment,
  Event,
  GroupAdd,
  Notifications,
  Update,
} from '@mui/icons-material';
import { Notification } from './types';

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_task':
    case 'task':
      return <AssignmentInd />;
    case 'deadline':
      return <Event />;
    case 'comment':
      return <Comment />;
    case 'status_change':
      return <Update />;
    case 'invitation':
      return <GroupAdd />;
    case 'info':
    case 'mention':
      return <Notifications />;
    default:
      return <Notifications />;
  }
};

export const getNotificationColor = (type: string) => {
  switch (type) {
    case 'new_task':
    case 'task':
      return '#4caf50';
    case 'deadline':
      return '#f44336';
    case 'comment':
      return '#2196f3';
    case 'status_change':
      return '#ff9800';
    case 'invitation':
      return '#9c27b0';
    case 'info':
    case 'mention':
      return '#2196f3'; // Blue for mentions/info
    default:
      return '#757575';
  }
};

// Mock data for notifications
export const notifications: Notification[] = [
  {
    id: 1,
    type: 'new_task',
    message: 'You have been assigned a new task: "Update user dashboard"',
    time: '5 minutes ago',
    read: false,
  },
  {
    id: 2,
    type: 'deadline',
    message: 'Project "Website Redesign" deadline is approaching in 2 days',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    type: 'comment',
    message: 'John Doe commented on your task: "Great progress!"',
    time: '3 hours ago',
    read: true,
  },
  {
    id: 4,
    type: 'status_change',
    message: 'Task "Implement login functionality" status changed to "In Review"',
    time: '1 day ago',
    read: true,
  },
  {
    id: 5,
    type: 'invitation',
    message: 'You have been invited to join the "Marketing Campaign" project',
    time: '2 days ago',
    read: true,
  },
];
