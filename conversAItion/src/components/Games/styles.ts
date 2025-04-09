import { rem } from '@mantine/core';
import { createStyles } from '@mantine/styles';

export const useStyles = createStyles((theme) => ({
  container: {
    width: '100%',
    height: '100%',
  },

  headerBar: {
    backgroundColor: theme.colors.dark[7],
    border: `${rem(1)} solid ${theme.colors.dark[4]}`,
    borderRadius: theme.radius.md,
  },

  scoreText: {
    color: theme.white,
    fontSize: theme.fontSizes.xl,
    fontWeight: 700,
  },

  timerNormal: {
    color: theme.colors.gray[5],
  },

  timerWarning: {
    color: theme.colors.red[6],
    animation: 'pulse 1s infinite',
  },

  card: {
    padding: 0,
    borderRadius: theme.radius.md,
    transition: 'transform 0.2s ease',
    backgroundColor: 'transparent',

    '&:hover:not(:disabled)': {
      transform: 'translateY(-2px)',
    },
  },

  cardContent: {
    height: rem(120),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.radius.md,
    transition: 'all 0.2s ease',
  },

  cardDefault: {
    backgroundColor: theme.colors.dark[6],
    border: `${rem(1)} solid ${theme.colors.dark[4]}`,
  },

  cardSelected: {
    backgroundColor: theme.colors.blue[9],
    border: `${rem(1)} solid ${theme.colors.blue[6]}`,
  },

  cardMatched: {
    backgroundColor: theme.colors.green[9],
    border: `${rem(1)} solid ${theme.colors.green[6]}`,
  },

  cardDisabled: {
    backgroundColor: theme.colors.dark[8],
    border: `${rem(1)} solid ${theme.colors.dark[5]}`,
    opacity: 0.5,
  },

  wordText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },

  wordTextDefault: {
    color: theme.white,
  },

  wordTextMatched: {
    color: theme.colors.gray[3],
    opacity: 0.9,
  },

  wordTextDisabled: {
    color: theme.colors.dark[2],
    opacity: 0.5,
  },

  gameComplete: {
    animation: 'fadeIn 0.5s ease',
  },

  exitButton: {
    transition: 'all 0.2s ease',
    
    '&:hover': {
      backgroundColor: theme.colors.red[9],
      color: theme.white,
    },
  },

  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.6,
    },
    '100%': {
      opacity: 1,
    },
  },

  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },

  grid: {
    gap: theme.spacing.md,
  },

  statsGroup: {
    gap: theme.spacing.xl,
  },

  closeButton: {
    '&:hover': {
      backgroundColor: theme.colors.dark[5],
    },
  },

  badge: {
    textTransform: 'uppercase',
    letterSpacing: rem(0.5),
  },

  scoreContainer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));