'use client';

import { createTheme, alpha } from '@mui/material/styles';

// Design tokens
const palette = {
  navy: '#1a2332',
  navyLight: '#243044',
  teal: '#2dd4bf',
  tealDark: '#14b8a6',
  tealMuted: '#0d9488',
  slate: '#64748b',
  slateLight: '#94a3b8',
  offWhite: '#f8fafc',
  cardBg: '#ffffff',
  border: '#e2e8f0',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: palette.navy,
      light: palette.navyLight,
      dark: '#0f172a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: palette.teal,
      light: '#5eead4',
      dark: palette.tealMuted,
      contrastText: palette.navy,
    },
    background: {
      default: palette.offWhite,
      paper: palette.cardBg,
    },
    text: {
      primary: palette.navy,
      secondary: palette.slate,
    },
    divider: palette.border,
    success: { main: palette.success },
    warning: { main: palette.warning },
    error: { main: palette.error },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.375rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
      color: palette.slate,
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    `0 1px 2px ${alpha(palette.navy, 0.04)}`,                          // 1
    `0 1px 4px ${alpha(palette.navy, 0.06)}`,                          // 2
    `0 2px 8px ${alpha(palette.navy, 0.06)}`,                          // 3
    `0 4px 12px ${alpha(palette.navy, 0.06)}`,                         // 4
    `0 6px 16px ${alpha(palette.navy, 0.08)}`,                         // 5
    `0 8px 24px ${alpha(palette.navy, 0.08)}`,                         // 6
    `0 12px 32px ${alpha(palette.navy, 0.1)}`,                         // 7
    `0 16px 40px ${alpha(palette.navy, 0.1)}`,                         // 8
    `0 20px 48px ${alpha(palette.navy, 0.12)}`,                        // 9
    `0 24px 56px ${alpha(palette.navy, 0.12)}`,                        // 10
    `0 28px 64px ${alpha(palette.navy, 0.14)}`,                        // 11
    `0 32px 72px ${alpha(palette.navy, 0.14)}`,                        // 12
    ...Array(12).fill(`0 32px 72px ${alpha(palette.navy, 0.14)}`),     // 13-24
  ] as unknown as typeof createTheme extends (o: infer O) => unknown ? O extends { shadows: infer S } ? S : never : never,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.offWhite,
        },
        '*::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: alpha(palette.slate, 0.2),
          borderRadius: '3px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: alpha(palette.slate, 0.35),
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${palette.navy} 0%, ${palette.navyLight} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${palette.navyLight} 0%, ${palette.navy} 100%)`,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 14px ${alpha(palette.navy, 0.25)}`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${palette.teal} 0%, ${palette.tealDark} 100%)`,
          color: palette.navy,
          fontWeight: 700,
          '&:hover': {
            background: `linear-gradient(135deg, ${palette.tealDark} 0%, ${palette.tealMuted} 100%)`,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 14px ${alpha(palette.teal, 0.3)}`,
          },
        },
        outlined: {
          borderColor: palette.border,
          '&:hover': {
            borderColor: palette.navy,
            backgroundColor: alpha(palette.navy, 0.03),
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha(palette.navy, 0.12),
            boxShadow: `0 4px 16px ${alpha(palette.navy, 0.06)}`,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.slateLight,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.tealDark,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
        filled: {
          backgroundColor: alpha(palette.teal, 0.12),
          color: palette.tealMuted,
          '&:hover': {
            backgroundColor: alpha(palette.teal, 0.2),
          },
        },
      },
    },
    MuiAccordion: {
      defaultProps: {
        elevation: 0,
        disableGutters: true,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${palette.border}`,
          borderRadius: '12px !important',
          marginBottom: 12,
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 12px 0',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '4px 20px',
          minHeight: 56,
          '&.Mui-expanded': {
            minHeight: 56,
          },
        },
        content: {
          margin: '12px 0',
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 20px 20px',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${palette.border}`,
          backgroundColor: palette.cardBg,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.cardBg, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${palette.border}`,
          color: palette.navy,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '8px 12px',
          '&.Mui-selected': {
            backgroundColor: alpha(palette.teal, 0.1),
            color: palette.tealMuted,
            '&:hover': {
              backgroundColor: alpha(palette.teal, 0.15),
            },
            '& .MuiListItemIcon-root': {
              color: palette.tealMuted,
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: palette.border,
        },
      },
    },
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default theme;
export { palette };
