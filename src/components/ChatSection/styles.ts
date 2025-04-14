import { keyframes } from '@emotion/react';

export const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    width: '100%',
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundColor: 'var(--mantine-color-dark-8)',
    // UPDATED for new teal gradient. Adjust RGBA or remove entirely as you see fit:
    backgroundImage:
        'radial-gradient(circle at 100% 100%, rgba(34, 87, 122, 0.2) 0%, transparent 40%), ' +
        'radial-gradient(circle at 0% 0%, rgba(56, 163, 165, 0.1) 0%, transparent 40%)',
    backgroundAttachment: 'fixed',
  },

  chatArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
    paddingBottom: '100px',
    scrollBehavior: 'smooth' as const,
    // The following properties are animated via framer-motion
    // marginLeft and width are controlled by animation
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(44, 46, 51, 0.6)',
      borderRadius: '4px',
      transition: 'background 0.2s ease',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(44, 46, 51, 0.8)',
    },
  },

  shelf: {
    position: 'fixed' as const,
    top: '60px',
    left: 0,
    bottom: 0,
    width: '320px',
    zIndex: 100,
    backgroundColor: 'var(--mantine-color-dark-8)',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
    borderRight: '1px solid var(--mantine-color-dark-5)',
    transition:
        'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateX(-100%)', // Default to hidden position
    backdropFilter: 'blur(8px)',
  },

  shelfContent: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(26, 27, 30, 0.5)',
    padding: '16px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    position: 'absolute' as const,
    left: 0,
    top: 0,
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '6px',
      transition: 'background 0.2s ease',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(255, 255, 255, 0.2)',
    },
  },

  shelfArrow: {
    position: 'absolute' as const,
    left: 0,
    top: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 101,
    backgroundColor: 'var(--mantine-color-dark-7)',
    borderRadius: '0 6px 6px 0',
    border: '1px solid var(--mantine-color-dark-5)',
    borderLeft: 'none',
    boxShadow: '3px 0px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--mantine-color-dark-6)',
      boxShadow: '3px 0px 12px rgba(0, 0, 0, 0.18)',
    },
  },

  newChatButton: {
    backgroundColor: 'var(--mantine-color-dark-7)',
    border: '1px solid var(--mantine-color-dark-5)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    fontWeight: 500,
    '&:hover': {
      backgroundColor: 'var(--mantine-color-dark-6)',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
    },
  },

  chatTab: {
    backgroundColor: 'rgba(37, 38, 43, 0.3)',
    borderRadius: '6px',
    padding: '12px 14px',
    marginBottom: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&:hover': {
      backgroundColor: 'rgba(44, 46, 51, 0.5)',
      transform: 'translateX(2px)',
      borderColor: 'var(--mantine-color-dark-4)',
      '& > div > div:lastChild': {
        opacity: 1,
      },
    },
    '&::before': {
      content: '""',
      position: 'absolute' as const,
      left: 0,
      top: 0,
      height: '100%',
      width: '0',
      backgroundColor: 'var(--mantine-color-primary-5)',
      opacity: 0.3,
      transition: 'width 0.3s ease',
    },
    '&:hover::before': {
      width: '3px',
    },
  },

  chatTabActive: {
    backgroundColor: 'rgba(37, 38, 43, 0.6)',
    backdropFilter: 'blur(4px)',
    border: '1px solid var(--mantine-color-primary-8)',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    transform: 'translateX(2px)',
    '&::before': {
      width: '3px',
      opacity: 1,
    },
    '& > div > div:lastChild': {
      opacity: 1,
    },
  },

  dateDividerChat: {
    padding: '12px 0 8px 0',
    color: 'var(--mantine-color-gray-6)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },

  messageContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },

  messageGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    padding: '4px 0',
  },

  messageBubbleWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    maxWidth: '68%',
    gap: '2px',
    alignSelf: 'flex-start',
    animation: `${slideInLeft} 0.3s ease-out`,
    position: 'relative' as const,
  },

  messageBubbleWrapperUser: {
    alignSelf: 'flex-end',
    animation: `${slideInRight} 0.3s ease-out`,
  },

  messageBubbleBase: {
    padding: '12px 16px',
    borderRadius: '18px',
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    width: 'fit-content',
    fontSize: '15px',
    lineHeight: '1.5',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
    },
  },

  messageBubbleAssistant: {
    backgroundColor: 'rgba(37, 38, 43, 0.75)',
    color: '#E0E0E0',
    borderTopLeftRadius: '4px',
    alignSelf: 'flex-start',
    backdropFilter: 'blur(8px)',
    border: '1px solid var(--mantine-color-dark-4)',
    position: 'relative' as const,
    '&::before': {
      content: '""',
      position: 'absolute' as const,
      top: '-6px',
      left: '12px',
      width: '12px',
      height: '12px',
      backgroundColor: 'rgba(37, 38, 43, 0.75)',
      border: '1px solid var(--mantine-color-dark-4)',
      borderRight: 'none',
      borderBottom: 'none',
      transform: 'rotate(45deg)',
      borderTopLeftRadius: '2px',
    },
  },

  messageBubbleUser: {
    background: 'linear-gradient(135deg, var(--mantine-color-primary-7) 0%, var(--mantine-color-primary-8) 100%)',
    color: 'white',
    borderTopRightRadius: '4px',
    alignSelf: 'flex-end',
    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
    position: 'relative' as const,
    '&::before': {
      content: '""',
      position: 'absolute' as const,
      top: '-6px',
      right: '12px',
      width: '12px',
      height: '12px',
      background: 'linear-gradient(135deg, var(--mantine-color-primary-7) 0%, var(--mantine-color-primary-8) 100%)',
      transform: 'rotate(45deg)',
      borderTopRightRadius: '2px',
    },
  },

  inputContainer: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 27, 30, 0.85)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid var(--mantine-color-dark-5)',
    zIndex: 100,
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
    animation: `${fadeIn} 0.4s ease-out`,
  },

  inputWrapper: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: -120,
      left: 0,
      right: 0,
      height: 120,
      background: 'linear-gradient(to bottom, rgba(26, 27, 30, 0), rgba(26, 27, 30, 0.8))',
      pointerEvents: 'none',
      zIndex: -1,
    },
  },

  inputInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    padding: '20px',
    transition: 'transform 0.3s ease',
    '&:focus-within': {
      transform: 'translateY(-4px)',
    },
  },

  visualizersDesktop: {
    position: 'absolute' as const,
    top: '-60px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 101,
    padding: '10px 16px',
    backgroundColor: 'rgba(26, 27, 30, 0.6)',
    backdropFilter: 'blur(8px)',
    borderRadius: '12px',
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.12)',
    border: '1px solid var(--mantine-color-dark-5)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    animation: `${fadeIn} 0.5s ease-out`,
  },

  canvas: {
    border: '1px solid var(--mantine-color-dark-4)',
    borderRadius: '8px',
    backgroundColor: 'rgba(37, 38, 43, 0.8)',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: 'inset 0 1px 5px rgba(0, 0, 0, 0.3)',
    },
  },

  loaderOverlay: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(26, 27, 30, 0.7)',
    backdropFilter: 'blur(4px)',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },

  messageText: {
    fontSize: '15px',
    lineHeight: '1.5',
    color: 'var(--mantine-color-white)',
  },

  messageTimestamp: {
    fontSize: '11px',
    color: 'var(--mantine-color-gray-5)',
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: 'rgba(44, 46, 51, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'inline-block',
    margin: '4px 0',
  },

  messageAudio: {
    width: '100%',
    height: '48px',
    borderRadius: '8px',
    marginTop: '12px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid var(--mantine-color-dark-5)',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.01)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    },
  },

  dateDivider: {
    position: 'relative',
    textAlign: 'center' as const,
    margin: '28px 0 20px',
    '&::before': {
      content: '""',
      position: 'absolute' as const,
      left: 0,
      right: 0,
      top: '50%',
      height: '1px',
      background:
          'linear-gradient(to right, transparent, var(--mantine-color-dark-4), transparent)',
      zIndex: 0,
    },
    animation: `${fadeIn} 0.5s ease-out`,
  },

  dateBadge: {
    position: 'relative',
    backgroundColor: 'var(--mantine-color-dark-8)',
    padding: '4px 16px',
    zIndex: 1,
    color: 'var(--mantine-color-gray-5)',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '12px',
    border: '1px solid var(--mantine-color-dark-5)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(4px)',
    letterSpacing: '0.5px',
  },

  emptyStateContainer: {
    height: 'calc(100vh - 200px)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    backdropFilter: 'blur(4px)',
    padding: '32px',
    borderRadius: '16px',
    animation: `${fadeIn} 0.8s ease-out`,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
} as const;
