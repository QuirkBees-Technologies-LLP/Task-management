import { grey } from '@mui/material/colors';

export const getLightPalette = (primaryColor) => ({
  primary: {
    main: primaryColor,
  },

  background: {
    default: '#F9FAFC',
    paper: '#ffffff',
  },
  text: {
    primary: grey[900],
    secondary: grey[700],
  },
});

export const getDarkPalette = (primaryColor) => ({
  primary: {
    main: primaryColor,
  },
  background: {
    default: '#0c1524',
    paper: '#1a1a26',
  },
  text: {
    primary: grey[300],
    secondary: grey[400],
  },
});
