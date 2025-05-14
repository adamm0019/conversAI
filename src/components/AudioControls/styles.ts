export const audioControlStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: 'var(--mantine-color-dark-6)',
    border: '1px solid var(--mantine-color-dark-4)'
  },
  visualizer: {
    width: '100px',
    height: '40px',
    backgroundColor: 'var(--mantine-color-dark-7)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  button: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
} as const;
