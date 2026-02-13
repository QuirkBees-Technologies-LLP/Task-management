import React, { useEffect, useState } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  styled,
  Divider,
  Stack,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  CircularProgress,
  Box,
  Pagination,
} from '@mui/material';
import { AccessTime, MoreVert, VisibilityOffOutlined, VisibilityOutlined, Delete } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { loadNotifications, submitMarkAsRead } from '@/redux/slices';
import { selectNotifications } from '@/redux/selectors';
import { getNotificationColor, getNotificationIcon } from '../helpers';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

// Styled components for Avatar and Notification Icon
const NotificationAvatar = styled(ListItemAvatar)(({ theme }) => ({
  minWidth: 0,
  marginRight: theme.spacing(2),
}));

const NotificationIcon = styled(Paper)(({ theme }) => ({
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.common.white,
}));

// Helper function to format time ago
const formatTimeAgo = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
};

// Map notification type from database to display type
const mapNotificationType = (message: string, type?: string): string => {
  // Use the type from database if available
  if (type && type !== 'info') return type;
  
  // Infer type from message content
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('mentioned')) return 'mention';
  if (lowerMessage.includes('assigned')) return 'new_task';
  if (lowerMessage.includes('deadline')) return 'deadline';
  if (lowerMessage.includes('commented')) return 'comment';
  if (lowerMessage.includes('status changed') || lowerMessage.includes('status changed to')) return 'status_change';
  if (lowerMessage.includes('invited')) return 'invitation';
  
  return 'info'; // default
};

const Notifications: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: notifications, loading } = useSelector(selectNotifications);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    // Only load notifications if we don't have any cached data
    // This prevents refetching on every route change
    if (!notifications || notifications.length === 0) {
    dispatch(loadNotifications({ limit: 100 }));
    }
  }, [dispatch]); // Removed notifications from deps to prevent refetch

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotificationId(notificationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotificationId(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.put(
        '/api/notifications',
        { id: notificationId, read: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      dispatch(submitMarkAsRead({ id: notificationId }));
      dispatch(loadNotifications({ limit: 100 })); // Refresh list
      handleMenuClose();
      enqueueSnackbar({
        message: 'Notification marked as read',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to mark notification as read',
        variant: 'error',
      });
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.put(
        '/api/notifications',
        { id: notificationId, read: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      dispatch(loadNotifications({ limit: 100 })); // Refresh list
      handleMenuClose();
      enqueueSnackbar({
        message: 'Notification marked as unread',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Error marking notification as unread:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to mark notification as unread',
        variant: 'error',
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.delete(`/api/notifications?_id=${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar({ message: 'Notification deleted', variant: 'success' });
      dispatch(loadNotifications({ limit: 100 })); // Refresh list
      handleMenuClose();
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete notification',
        variant: 'error',
      });
    }
  };

  const totalPages = Math.ceil((notifications?.length || 0) / limit);
  const displayedNotifications = (notifications || []).slice((page - 1) * limit, page * limit);

  if (loading && (!notifications || notifications.length === 0)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No notifications yet
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List sx={{ p: 0 }}>
        {displayedNotifications.map((notification: any) => {
          const notificationId = notification._id?.toString() || notification.id?.toString();
          const notificationType = mapNotificationType(notification.message || '', notification.type);
          const isRead = notification.read || false;
          
          return (
            <React.Fragment key={notificationId}>
              <ListItem
                sx={{
                  bgcolor: isRead ? 'transparent' : (theme) => theme.palette.action.hover,
                  ':hover': {
                    bgcolor: (theme) => theme.palette.background.default,
                    cursor: 'pointer',
                  },
                }}
                onClick={(e) => {
                  // Stop event propagation to prevent menu from closing before redirect
                  e.stopPropagation();
                  // Redirect to notification page on click
                  router.push('/dashboard/notifications');
                }}
              >
                {/* Notification Icon */}
                <NotificationAvatar>
                  <NotificationIcon sx={{ bgcolor: getNotificationColor(notificationType) }}>
                    {getNotificationIcon(notificationType)}
                  </NotificationIcon>
                </NotificationAvatar>

                {/* Notification Message */}
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle2" 
                      color="text.primary"
                      sx={{ fontWeight: isRead ? 400 : 600 }}
                    >
                      {notification.message}
                    </Typography>
                  }
                  secondary={
                    <Stack component={'span'} direction="row" alignItems="center" spacing={1}>
                      <AccessTime sx={{ fontSize: 18 }} />
                      <Typography variant="caption" color="text.secondary" component="span">
                        {notification.createdAt 
                          ? formatTimeAgo(notification.createdAt)
                          : 'Recently'}
                      </Typography>
                    </Stack>
                  }
                />

                {/* Menu Options */}
                <ListItemIcon>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the list item click
                      handleMenuClick(e, notificationId);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && selectedNotificationId === notificationId}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                  >
                    {!isRead ? (
                      <MenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notificationId);
                        }}
                      >
                        <ListItemIcon>
                          <VisibilityOffOutlined fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Mark as read</ListItemText>
                      </MenuItem>
                    ) : (
                      <MenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsUnread(notificationId);
                        }}
                      >
                        <ListItemIcon>
                          <VisibilityOutlined fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Mark as unread</ListItemText>
                      </MenuItem>
                    )}
                    <MenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notificationId);
                      }}
                    >
                      <ListItemIcon>
                        <Delete fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Delete</ListItemText>
                    </MenuItem>
                  </Menu>
                </ListItemIcon>
              </ListItem>
              <Divider />
            </React.Fragment>
          );
        })}
      </List>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1, px: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
};

export default Notifications;
