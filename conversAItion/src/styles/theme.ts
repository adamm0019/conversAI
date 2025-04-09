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

    // dark mode
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
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
        },
      }),
    },
    AppShell: {
      styles: (theme: { colors: { dark: any[]; }; }) => ({
        main: {
          backgroundColor: theme.colors.dark[7],
        },
      }),
    },
    Paper: {
      styles: (theme: { colors: { dark: any[]; }; }) => ({
        root: {
          backgroundColor: theme.colors.dark[6],
        },
      }),
    },
    Select: {
      styles: (theme: { colors: { dark: any[]; }; }) => ({
        input: {
          backgroundColor: theme.colors.dark[6],
        },
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
});

// unused css variables - to be removed

export const cssVariables = {
  colors: {
    primary: 'var(--mantine-color-primary-6)',
    primaryLight: 'var(--mantine-color-primary-4)',
    primaryDark: 'var(--mantine-color-primary-8)',
    background: 'var(--mantine-color-dark-7)',
    surface: 'var(--mantine-color-dark-6)',
    text: 'var(--mantine-color-white)',
    textSecondary: 'var(--mantine-color-dark-0)',
  },
  spacing: {
    xs: 'var(--mantine-spacing-xs)',
    sm: 'var(--mantine-spacing-sm)',
    md: 'var(--mantine-spacing-md)',
    lg: 'var(--mantine-spacing-lg)',
    xl: 'var(--mantine-spacing-xl)',
  },
};