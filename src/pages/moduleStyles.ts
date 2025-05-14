import { rem } from '@mantine/core';
import { createStyles } from '@mantine/styles';

export const useModuleStyles = createStyles((theme) => ({
  container: {
    minHeight: 'calc(100vh - 60px)',
  },

  tabsContainer: {
    marginBottom: rem(32),
  },

  moduleCard: {
    backgroundColor: 'var(--mantine-color-dark-7)',
    border: '1px solid var(--mantine-color-dark-4)',
    transition: 'all 0.25s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
    position: 'relative',

    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    },

    '&.locked': {
      backgroundColor: theme.colors.dark[8],
      borderColor: theme.colors.dark[5],
      opacity: 0.8,
    },

    '&.completed': {
      borderColor: theme.colors.green[7],
    },
  },

  statusBadge: {
    position: 'absolute',
    top: rem(-15),
    right: rem(20),
    width: rem(40),
    height: rem(40),
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${theme.colors.dark[7]}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },

  levelCircle: {
    width: rem(40),
    height: rem(40),
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },

  skillBadge: {
    fontSize: theme.fontSizes.xs,
    padding: `${rem(2)} ${rem(8)}`,
    borderRadius: theme.radius.sm,
  },

  progressContainer: {
    marginTop: 'auto',
    padding: rem(16),
  },

  progressBar: {
    height: rem(8),
    borderRadius: rem(4),
  },

  actionButton: {
    marginTop: rem(16),
    borderRadius: theme.radius.md,
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rem(12),
  },

  infoLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.gray[6],
  },

  infoValue: {
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
  },

  nextLesson: {
    padding: `${rem(8)} ${rem(12)}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dark[6],
    marginTop: rem(12),
  },

  achievementIcon: {
    color: 'var(--mantine-color-yellow-4)',
  },

  overallProgress: {
    minWidth: rem(200),
    backgroundColor: 'var(--mantine-color-dark-6)',
    padding: rem(16),
    borderRadius: rem(8),
  },
}));