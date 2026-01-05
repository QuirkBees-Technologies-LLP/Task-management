import React from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { GeneralProps } from '../types';

const General: React.FC<GeneralProps> = ({ notifications, handleNotificationChange }) => {
  return (
    <Paper sx={{ p: 2 }} role="tabpanel" id="settings-tabpanel-1" aria-labelledby="settings-tab-1">
      <Box>
        <Typography variant="h6">Notification Preferences</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={notifications.email}
              onChange={handleNotificationChange}
              name="email"
            />
          }
          label="Email Notifications"
        />
        <FormControlLabel
          control={
            <Switch checked={notifications.push} onChange={handleNotificationChange} name="push" />
          }
          label="Push Notifications"
        />
        <FormControlLabel
          control={
            <Switch checked={notifications.sms} onChange={handleNotificationChange} name="sms" />
          }
          label="SMS Notifications"
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ pb: 2 }}>
          General Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="default-view-label">Default Project View</InputLabel>
              <Select
                labelId="default-view-label"
                id="default-view"
                defaultValue="kanban"
                label="Default Project View"
              >
                <MenuItem value="kanban">Kanban Board</MenuItem>
                <MenuItem value="list">List View</MenuItem>
                <MenuItem value="timeline">Timeline</MenuItem>
                <MenuItem value="calendar">Calendar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Working Hours"
              variant="outlined"
              type="text"
              defaultValue="9:00 AM - 5:00 PM"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="timezone-label">Time Zone</InputLabel>
              <Select labelId="timezone-label" id="timezone" defaultValue="UTC" label="Time Zone">
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="EST">Eastern Time (ET)</MenuItem>
                <MenuItem value="CST">Central Time (CT)</MenuItem>
                <MenuItem value="MST">Mountain Time (MT)</MenuItem>
                <MenuItem value="PST">Pacific Time (PT)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="language-label">Language</InputLabel>
              <Select labelId="language-label" id="language" defaultValue="en" label="Language">
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
                <MenuItem value="zh">中文</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="default-priority-label">Default Task Priority</InputLabel>
              <Select
                labelId="default-priority-label"
                id="default-priority"
                defaultValue="medium"
                label="Default Task Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" sx={{ float: 'right' }}>
              Save Changes
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default General;
