import { createTheme } from '@mui/material';

export const getTheme = (darkMode: boolean) =>
    createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: '#3b82f6',
                light: '#60a5fa',
                dark: '#2563eb',
            },
            secondary: {
                main: '#14b8a6',
                light: '#2dd4bf',
                dark: '#0d9488',
            },
            error: {
                main: '#ef4444',
            },
            background: {
                default: darkMode ? '#111622' : '#ffffff',
                paper: darkMode ? '#1a1f2e' : '#ffffff',
            },
            text: {
                primary: darkMode ? '#f8fafc' : '#111827',
                secondary: darkMode ? '#cbd5e1' : '#4b5563',
            },
        },
        typography: {
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            h4: { fontWeight: 700, letterSpacing: '-0.02em' },
            h5: { fontWeight: 700, letterSpacing: '-0.01em' },
            h6: { fontWeight: 600, letterSpacing: '-0.01em' },
            subtitle1: { fontWeight: 600 },
            body1: { fontSize: '0.95rem' },
            button: { textTransform: 'none' as const, fontWeight: 600 },
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        textTransform: 'none',
                        fontWeight: 600,
                        padding: '10px 24px',
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' },
                    },
                    contained: {
                        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
                            transform: 'translateY(-1px)',
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 20,
                        padding: 8,
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 12,
                        },
                    },
                },
            },
        },
    });
