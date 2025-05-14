import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'primary',
  colors: {
    primary: [
      '#E3F2FD',
      '#BBDEFB',
      '#90CAF9',
      '#64B5F6',
      '#42A5F5',
      '#1976D2',
      '#1565C0',
      '#0D47A1',
      '#0A2472',
      '#061539',
    ],


    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#121418',
      '#0A0B0E',
    ],
  },

  components: {
    Button: {
      defaultProps: {
        variant: 'light',
      },
      styles: (theme: { radius: { md: any; }; }) => ({
        root: {
          borderRadius: theme.radius.md,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          },
        },
      }),
    },
    AppShell: {
      styles: (theme: { colors: { dark: any[]; }; }) => ({
        main: {
          backgroundColor: theme.colors.dark[8],
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(25, 118, 210, 0.05) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(37, 38, 43, 0.1) 0%, transparent 40%)',
          backgroundAttachment: 'fixed',
        },
      }),
    },
    Paper: {
      styles: (theme: { colors: { dark: any[]; }; }) => ({
        root: {
          backgroundColor: theme.colors.dark[6],
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
          },
        },
      }),
    },
    Select: {
      styles: (theme: { colors: { dark: any[]; }; }) => ({
        input: {
          backgroundColor: theme.colors.dark[6],
          transition: 'all 0.2s ease',
          '&:focus': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
          },
        },
      }),
    },
    TextInput: {
      styles: (theme: { colors: { dark: any[]; }; }) => ({
        input: {
          backgroundColor: theme.colors.dark[6],
          transition: 'all 0.2s ease',
          '&:focus': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
          },
        },
      }),
    },
    ActionIcon: {
      styles: () => ({
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      }),
    },
    Modal: {
      styles: (theme: { colors: { dark: any[]; }; }) => ({
        content: {
          backgroundColor: theme.colors.dark[7],
          backdropFilter: 'blur(10px)',
        },
        header: {
          backgroundColor: theme.colors.dark[8],
        },
      }),
    },
    Tooltip: {
      styles: () => ({
        tooltip: {
          backdropFilter: 'blur(6px)',
        }
      }),
    },
  },

  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },
  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(8),
    lg: rem(16),
    xl: rem(32),
  },
  spacing: {
    xs: rem(8),
    sm: rem(12),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },
  defaultGradient: {
    from: 'primary.6',
    to: 'primary.8',
    deg: 135,
  },
  cursorType: 'pointer',
});
