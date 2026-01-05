import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  styled,
  Divider,
  Stack,
  Button,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  Paper,
} from '@mui/material';
import { ExpandMore, AccessTime, MoreVert, VisibilityOffOutlined } from '@mui/icons-material';
import { getNotificationColor, getNotificationIcon, notifications } from '../helpers';

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

const Notifications: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <List sx={{ p: 0 }}>
        {notifications.map((notification) => (
          <React.Fragment key={notification.id}>
            <ListItem
              sx={{
                ':hover': {
                  bgcolor: (theme) => theme.palette.background.default,
                  cursor: 'pointer',
                },
              }}
            >
              {/* Notification Icon */}
              <NotificationAvatar>
                <NotificationIcon sx={{ bgcolor: getNotificationColor(notification.type) }}>
                  {getNotificationIcon(notification.type)}
                </NotificationIcon>
              </NotificationAvatar>

              {/* Notification Message */}
              <ListItemText
                primary={
                  <Typography variant="subtitle2" color="text.primary">
                    {notification.message}
                  </Typography>
                }
                secondary={
                  <Stack component={'span'} direction="row" alignItems="center" spacing={1}>
                    <AccessTime sx={{ fontSize: 18 }} />
                    <Typography variant="caption" color="text.secondary" component="span">
                      {notification.time}
                    </Typography>
                  </Stack>
                }
              />

              {/* Menu Options */}
              <ListItemIcon>
                <IconButton onClick={handleMenuClick}>
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
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
                  <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                      <VisibilityOffOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Hide</ListItemText>
                  </MenuItem>
                </Menu>
              </ListItemIcon>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      {/* Show More Button */}
      <Stack alignItems="center" sx={{ py: 1 }}>
        <Button startIcon={<ExpandMore />}>Show more</Button>
      </Stack>
    </>
  );
};

export default Notifications;
