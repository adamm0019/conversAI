import { rem } from '@mantine/core';

// currently using this file to hold the styles for modules page

export const moduleStyles = {
  pathContainer: {
    position: 'relative',
    maxWidth: '800px',
    margin: '0 auto',
    padding: `${rem(20)} ${rem(40)}`,
    minHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
  } as const,

  moduleCard: {
    position: 'relative',
    marginBottom: rem(40),
    border: '1px solid var(--mantine-color-dark-4)',
    background: 'rgba(37, 38, 43, 0.75)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    },
  } as const,

  connectionLine: {
    position: 'absolute',
    top: '100%',
    left: rem(47),
    height: rem(40),
    overflow: 'hidden',
  } as const,

  iconContainer: {
    width: rem(48),
    height: rem(48),
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  } as const,

  statusIcon: {
    position: 'absolute',
    top: rem(12),
    right: rem(12),
  } as const,
};