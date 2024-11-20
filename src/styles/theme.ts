import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'primary',
  colors: {
    // Custom primary color palette
    primary: [
      '#E3F2FD', // 0: Lightest
      '#BBDEFB', // 1
      '#90CAF9', // 2
      '#64B5F6', // 3
      '#42A5F5', // 4
      '#1976D2', // 5: Primary
      '#1565C0', // 6
      '#0D47A1', // 7
      '#0A2472', // 8
      '#061539', // 9: Darkest
    ],
    // Dark theme colors
    dark: [
      '#C1C2C5', // 0
      '#A6A7AB', // 1
      '#909296', // 2
      '#5C5F66', // 3
      '#373A40', // 4
      '#2C2E33', // 5
      '#25262B', // 6
      '#1A1B1E', // 7
      '#141517', // 8
      '#101113', // 9
    ],
  },
  
  // Custom component styles
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

  // Global theme properties
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

// CSS Variables for use outside of Mantine components
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