import { createTheme, responsiveFontSizes } from '@mui/material';
import { shadows } from './shadows';
import { components } from './components';
import { getLightPalette, getDarkPalette } from './palette';
import { typography } from './typography';

const getTheme = ({ primaryColor, fontFamily }) =>
  responsiveFontSizes(
    createTheme({
      colorSchemes: {
        light: {
          palette: getLightPalette(primaryColor),
        },
        dark: {
          palette: getDarkPalette(primaryColor),
        },
      },
      cssVariables: {
        colorSchemeSelector: 'class',
      },
      typography: {
        ...typography,
        fontFamily: `${fontFamily}, sans-serif`,
      },
      shape: {
        borderRadius: 10,
      },
      shadows: shadows(primaryColor),
      components,
    })
  );

export { getTheme };
