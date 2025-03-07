import { rem } from '@mantine/core';

export const headerStyles = {
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    background: 'rgba(26, 27, 30, 0.85)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  navbarInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: rem(60),
    padding: `${rem(4)} ${rem(16)}`,
  },
  actionButton: {
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--mantine-color-dark-5)',
      transform: 'translateY(-1px)',
    },
  },
  languageGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: rem(12),
    '& > *': {
      transition: 'all 0.2s ease',
    },
  },
  languageSelect: {
    '& input': {
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: 'var(--mantine-color-blue-4)',
      },
      '&:focus': {
        borderColor: 'var(--mantine-color-blue-5)',
        boxShadow: '0 0 0 2px rgba(51, 154, 240, 0.1)',
      },
    },
    '& .mantineSelectdropdown': {
      border: '1px solid var(--mantine-color-dark-4)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    },
    '& .mantineSelectitem': {
      transition: 'background-color 0.2s ease',
      '&[datSelected]': {
        backgroundColor: 'var(--mantine-color-blue-7)',
      },
      '&[dataHovered]': {
        backgroundColor: 'var(--mantine-color-dark-5)',
      },
    },
  },
  proficiencyBadge: {
    transition: 'all 0.2s ease',
    backgroundColor: 'var(--mantine-color-dark-6)',
    '&:hover': {
      backgroundColor: 'var(--mantine-color-dark-5)',
      transform: 'translateY(-1px)',
    },
  },
};
