import { CSSProperties } from 'react';
import { keyframes } from '@emotion/react';

export const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

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

type StyleObject = {
  [key: string]: CSSProperties;
};

export const chatSectionStyles: StyleObject = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    position: 'relative',
    backgroundColor: '#1A1B1E',
  } as CSSProperties,
  messageContainer: {
    maxWidth: '85%',
    position: 'relative',
    display: 'flex',
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: '1rem',
  } as CSSProperties,
  messageBubbleBase: {
    padding: 'var(--mantine-spacing-md) var(--mantine-spacing-xl)',
    borderRadius: '20px',
    position: 'relative',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minWidth: '280px',
    maxWidth: '100%',
    '@media (min-width: 768px)': {
      maxWidth: '85%',
    },
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--mantine-spacing-xs)',
  } as CSSProperties,
  messageBubbleAssistant: {
    background: 'linear-gradient(135deg, rgba(44, 46, 60, 0.9), rgba(34, 36, 50, 0.8))',
    color: 'var(--mantine-color-white)',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginRight: 'auto',
  } as CSSProperties,
  messageBubbleUser: {
    background: 'linear-gradient(135deg, rgba(56, 127, 255, 0.9), rgba(37, 99, 235, 0.8))',
    color: 'var(--mantine-color-white)',
    borderBottomRightRadius: '4px',
    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    marginLeft: 'auto',
  } as CSSProperties,
  messageText: {
    margin: 0,
    lineHeight: 1.6,
    letterSpacing: '0.01em',
    fontSize: '0.95rem',
    fontWeight: 400,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    width: '100%',
    padding: 'var(--mantine-spacing-xs) 0',
  } as CSSProperties,
  messageAudio: {
    marginTop: 'var(--mantine-spacing-xs)',
    borderRadius: 'var(--mantine-radius-md)',
    width: '100%',
    minWidth: '280px',
    '@media (min-width: 768px)': {
      minWidth: '300px',
    },
    height: '40px',
    opacity: 0.9,
    transition: 'opacity 0.2s ease',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 'var(--mantine-spacing-xs)',
  } as CSSProperties,
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#1A1B1E',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
    height: 'calc(100vh - 60px)',
    scrollBehavior: 'smooth',
    padding: '16px 8px',
    '@media (min-width: 768px)': {
      padding: '32px 16px',
    },
  } as CSSProperties,
  recordingControls: {
    borderTop: '1px solid rgba(55, 58, 64, 0.5)',
    background: 'rgba(37, 38, 43, 0.95)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    bottom: 0,
    width: '100%',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
    padding: '16px 8px',
    '@media (min-width: 768px)': {
      padding: '24px 16px',
    },
  } as CSSProperties,
  inputWrapper: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    background: 'rgba(64, 65, 79, 0.9)',
    borderRadius: '12px',
    border: '1px solid rgba(86, 88, 105, 1)',
    padding: '8px',
    '@media (min-width: 768px)': {
      padding: '8px 12px',
    },
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  } as CSSProperties,
  canvas: {
    opacity: 0.8,
    transition: 'opacity 0.3s ease',
    filter: 'drop-shadow(0 0 8px rgba(51, 154, 240, 0.2))',
    width: '80px',
    '@media (min-width: 768px)': {
      width: '100px',
    },
    height: '40px',
  } as CSSProperties,
  loader: {
    position: 'absolute',
    top: -8,
    right: -8,
    opacity: 0.8,
  } as CSSProperties,
};
