import { createStyles, rem } from '@mantine/styles';

export const useSharedStyles = createStyles((theme) => ({
  gradientText: {
    background: `linear-gradient(45deg, ${theme.colors.primary[6]}, ${theme.colors.primary[4]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  audioButton: {
    backgroundColor: theme.colors.dark[6],
    color: theme.colors.primary[4],
    '&:hover': {
      backgroundColor: theme.colors.dark[5],
    },
  },

  cardHover: {
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },

  glassEffect: {
    backgroundColor: `${theme.fn.rgba(theme.colors.dark[7], 0.8)}`,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.fn.rgba(theme.colors.dark[4], 0.2)}`,
  },
}));