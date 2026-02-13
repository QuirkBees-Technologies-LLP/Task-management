// components/SettingsDrawer.js
import React from 'react';
import {
  Drawer,
  Typography,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  useTheme,
  useColorScheme,
} from '@mui/material';
import { Box, Stack } from '@mui/system';
import {
  Brightness7Outlined,
  CloseOutlined,
  DarkModeOutlined,
  SystemSecurityUpdate,
} from '@mui/icons-material';
import { useThemeContext } from '@/theme';
import { blue, red, teal } from '@mui/material/colors';

const SettingsDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const { mode, setMode } = useColorScheme();

  const { handleChangePrimaryColor, handleChangeFontFamily } = useThemeContext();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
    >
      <Box px={2} py={1.5}>
        <Stack direction={'row'} justifyContent={'space-between'}>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          <IconButton onClick={onClose}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Divider />
      <Box width={300} p={2}>
        {/* Dark Mode Toggle */}
        <Typography variant="button" gutterBottom>
          Mode
        </Typography>
        <Box my={2}>
          <ToggleButtonGroup value={mode} aria-label="theme mode" fullWidth>
            <ToggleButton value="light" aria-label="light mode" onClick={() => setMode('light')}>
              <Brightness7Outlined sx={{ fontSize: 16, mr: 1 }} /> Light
            </ToggleButton>
            <ToggleButton value="system" aria-label="system-mode" onClick={() => setMode('system')}>
              <SystemSecurityUpdate sx={{ fontSize: 16, mr: 1 }} /> System
            </ToggleButton>
            <ToggleButton value="dark" aria-label="dark mode" onClick={() => setMode('dark')}>
              <DarkModeOutlined sx={{ fontSize: 16, mr: 1 }} /> Dark
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        <Box mt={2}>
          <Typography variant="button" gutterBottom>
            Theme Color
          </Typography>
        </Box>

        <Stack
          direction={'row'}
          sx={{
            my: 2,
            justifyContent: 'space-evenly',
            ['& .MuiButtonBase-root']: {
              padding: 0.5,
              borderRadius: '50%',
            },
          }}
        >
          {[
            { color: blue[500], name: 'Blue' },
            { color: red[500], name: 'Red' },
            { color: teal[800], name: 'Teal' },
          ].map(({ color, name }) => (
            <Box key={name}>
              <Typography variant="caption">{name} </Typography>
              <ToggleButton
                value={color}
                selected={color === theme.palette.primary.main}
                aria-label="theme-color"
                onClick={(_, value) => handleChangePrimaryColor(value)}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: color,
                  }}
                />
              </ToggleButton>
            </Box>
          ))}
        </Stack>

        <Divider />

        <Box mt={2}>
          <Typography variant="button" gutterBottom>
            Font Family
          </Typography>
          <Stack
            direction={'row'}
            flexWrap={'wrap'}
            gap={2}
            sx={{
              my: 2,
              ['& .MuiButtonBase-root']: {
                width: 100,
              },
            }}
          >
            {[
              { name: 'Poppins', font: 'Poppins' },
              { name: 'Lato', font: 'Lato' },
              { name: 'Montserrat', font: 'Montserrat Variable' },
            ].map(({ name, font }) => (
              <ToggleButton
                key={font}
                value={font}
                selected={theme.typography.fontFamily?.split(',')[0] === font}
                aria-label="font-family"
                onClick={(_, value) => handleChangeFontFamily(value)}
              >
                <Typography variant="button" fontFamily={font}>
                  {name}
                </Typography>
              </ToggleButton>
            ))}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SettingsDrawer;
