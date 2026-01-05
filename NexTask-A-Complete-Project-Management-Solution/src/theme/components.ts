import { Components } from '@mui/material';

export const components: Components = {
  MuiBackdrop: {
    styleOverrides: {
      root: {
        backdropFilter: 'blur(5px)',
      },
    },
  },
  MuiContainer: {
    styleOverrides: {
      root: {
        '&.MuiContainer-maxWidthMd': {
          maxWidth: '1300px',
        },
      },
    },
  },
  MuiTable: {
    styleOverrides: {
      root: {
        ['& .MuiTableCell-head']: {
          fontWeight: 'bold',
        },
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      root: {
        ['& .MuiBackdrop-root']: {
          backdropFilter: 'none',
        },
      },
    },
  },
  MuiChip: {
    defaultProps: {
      size: 'small',
    },
    styleOverrides: {
      root: {
        minWidth: 100,
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSelect: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiPaper: {
    defaultProps: { variant: 'outlined' },
  },
  MuiGrid2: {
    defaultProps: {
      spacing: 2,
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      contained: {
        color: '#fff',
      },
    },
  },
  MuiLink: {
    defaultProps: {
      underline: 'none',
    },
  },
};
