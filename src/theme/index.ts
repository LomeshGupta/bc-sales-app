'use client';
import { createTheme, alpha } from '@mui/material/styles';
import { ThemeMode } from '@/types';

const RED_PRIMARY = '#D32F2F';
const RED_DARK = '#B71C1C';
const RED_LIGHT = '#EF5350';

export const createAppTheme = (mode: ThemeMode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: RED_PRIMARY, dark: RED_DARK, light: RED_LIGHT, contrastText: '#FFFFFF' },
      secondary: { main: isDark ? '#FFFFFF' : '#212121', contrastText: isDark ? '#212121' : '#FFFFFF' },
      background: {
        default: isDark ? '#0A0A0A' : '#F5F5F5',
        paper: isDark ? '#141414' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#FFFFFF' : '#212121',
        secondary: isDark ? '#9E9E9E' : '#757575',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      error: { main: '#F44336' },
      warning: { main: '#FF9800' },
      info: { main: '#2196F3' },
      success: { main: '#4CAF50' },
    },
    typography: {
      fontFamily: '"DM Sans", "Roboto", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.01em' },
      h3: { fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.5 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
      caption: { letterSpacing: '0.02em' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': { boxSizing: 'border-box', margin: 0, padding: 0 },
          html: { WebkitTextSizeAdjust: '100%' },
          body: { overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' },
          '::-webkit-scrollbar': { width: '4px', height: '4px' },
          '::-webkit-scrollbar-track': { background: 'transparent' },
          '::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            color: isDark ? '#FFFFFF' : '#212121',
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            background: isDark ? '#1A1A1A' : '#FFFFFF',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, padding: '10px 20px', fontSize: '0.9375rem', fontWeight: 600, transition: 'all 0.2s ease' },
          contained: {
            background: `linear-gradient(135deg, ${RED_PRIMARY}, ${RED_DARK})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${RED_LIGHT}, ${RED_PRIMARY})`,
              transform: 'translateY(-1px)',
              boxShadow: `0 8px 24px ${alpha(RED_PRIMARY, 0.4)}`,
            },
            '&:active': { transform: 'translateY(0)' },
          },
          outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' },
              '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: isDark ? 'rgba(14,14,14,0.9)' : 'rgba(255,255,255,0.9)',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            height: 65,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: isDark ? '#616161' : '#9E9E9E',
            minWidth: 60,
            '&.Mui-selected': { color: RED_PRIMARY },
          },
          label: { fontSize: '0.7rem', fontWeight: 600, '&.Mui-selected': { fontSize: '0.7rem' } },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
      MuiDrawer: {
        styleOverrides: {
          paper: { borderRadius: '0 16px 16px 0', border: 'none', background: isDark ? '#141414' : '#FFFFFF' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20, background: isDark ? '#1A1A1A' : '#FFFFFF' },
        },
      },
      MuiSnackbar: { styleOverrides: { root: { bottom: 80 } } },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            '&.Mui-selected': {
              background: alpha(RED_PRIMARY, isDark ? 0.15 : 0.08),
              color: RED_PRIMARY,
              '& .MuiListItemIcon-root': { color: RED_PRIMARY },
              '&:hover': { background: alpha(RED_PRIMARY, isDark ? 0.2 : 0.12) },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, background: isDark ? '#333' : '#212121' },
        },
      },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 4 } } },
    },
  });
};
