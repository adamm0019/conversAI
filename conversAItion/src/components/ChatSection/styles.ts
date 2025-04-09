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
  },

  chatArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
    paddingBottom: '100px',
    marginLeft: '28px',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#2C2E33',
      borderRadius: '4px',
    },
  },

  shelf: {
    position: 'fixed' as const,
    top: '60px',
    left: 0,
    bottom: 0,
    width: '320px',
    zIndex: 100,
    backgroundColor: '#1A1B1E',
  },

  shelfContent: {
    height: '100%',
    width: '100%',
    backgroundColor: '#1A1B1E',
    borderRight: '1px solid #2C2E33',
    padding: '16px',
    overflowY: 'auto' as const,
    position: 'absolute' as const,
    left: 0,
    top: 0,
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
    },
  },

  shelfArrow: {
    position: 'absolute' as const,
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '28px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 101,
    backgroundColor: '#1A1B1E',
    borderRadius: '0 4px 4px 0',
    border: '1px solid #2C2E33',
    borderLeft: 'none',
  },

  newChatButton: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#25262B',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#2C2E33',
      transform: 'translateY(-1px)',
    },
  },

  chatTab: {
    backgroundColor: 'rgba(37, 38, 43, 0.4)',
    borderRadius: '4px',
    padding: '12px 16px',
    marginBottom: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(44, 46, 51, 0.6)',
    },
  },

  chatTabActive: {
    backgroundColor: '#25262b',
    border: '1px solid #2C2E33',
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
    maxWidth: '65%',
    gap: '2px',
    alignSelf: 'flex-start',
  },

  messageBubbleWrapperUser: {
    alignSelf: 'flex-end',
  },

  messageBubbleBase: {
    padding: '8px 12px',
    borderRadius: '16px',
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    width: 'fit-content',
    fontSize: '14px',
    lineHeight: '20px',
  },

  messageBubbleAssistant: {
    backgroundColor: '#25262B',
    color: '#C1C2C5',
    borderTopLeftRadius: '4px',
    alignSelf: 'flex-start',
  },

  messageBubbleUser: {
    backgroundColor: 'var(--mantine-color-blue-7)',
    color: 'white',
    borderTopRightRadius: '4px',
    alignSelf: 'flex-end',
  },

  inputContainer: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1B1E',
    borderTop: '1px solid #2C2E33',
    zIndex: 100,
  },

  inputWrapper: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: -100,
      left: 0,
      right: 0,
      height: 100,
      background: 'linear-gradient(to bottom, transparent, #1A1B1E)',
      pointerEvents: 'none',
    },
  },

  inputInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    padding: '16px',
  },

  visualizersDesktop: {
    position: 'absolute' as const,
    top: '-50px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 101,
  },

  canvas: {
    border: '1px solid #2C2E33',
    borderRadius: '4px',
    backgroundColor: '#25262B',
  },

  loaderOverlay: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },

  messageText: {
    fontSize: '14px',
    lineHeight: '20px',
  },

  messageTimestamp: {
    fontSize: '11px',
    color: 'var(--mantine-color-gray-6)',
    padding: '0 4px',
  },

  messageAudio: {
    width: '100%',
    height: '40px',
    borderRadius: '4px',
    marginTop: '8px',
  },

  dateDivider: {
    position: 'relative',
    textAlign: 'center' as const,
    margin: '20px 0',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      top: '50%',
      height: '1px',
      backgroundColor: '#2C2E33',
      zIndex: 0,
    },
  },

  dateBadge: {
    position: 'relative',
    backgroundColor: '#1A1B1E',
    padding: '0 16px',
    zIndex: 1,
    color: 'var(--mantine-color-gray-6)',
    fontSize: '12px',
  },

  emptyStateContainer: {
    height: 'calc(100vh - 200px)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
  },
} as const;