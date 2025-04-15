import { keyframes } from '@emotion/react';

// --- Keyframes (kept for potential use, but relying more on Framer Motion) ---
export const slideIn = keyframes` /* ... */ `;
export const slideInLeft = keyframes` /* ... */ `;
export const slideInRight = keyframes` /* ... */ `;
export const fadeIn = keyframes` /* ... */ `;
export const pulseAnimation = keyframes` /* ... */ `;

// --- Main Style Object ---
export const styles = {
  // --- App Container ---
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh', // Use viewport height
    width: '100%',
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundColor: 'var(--mantine-color-dark-9)', // Darker base
    // Subtle gradient effect
    backgroundImage: `
      radial-gradient(circle at 100% 100%, rgba(var(--mantine-color-teal-9-rgb), 0.15) 0%, transparent 40%),
      radial-gradient(circle at 0% 0%, rgba(var(--mantine-color-blue-9-rgb), 0.1) 0%, transparent 40%)
    `,
    backgroundAttachment: 'fixed',
  },

  // --- Chat Area ---
  chatArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
    paddingBottom: '140px', // Increased padding for fixed input bar + visualizers
    scrollBehavior: 'smooth' as const,
    // Custom Scrollbar
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '3px',
      transition: 'background 0.2s ease',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(255, 255, 255, 0.2)',
    },
  },

  messageContainer: {
    maxWidth: '1000px', // Adjusted max width
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px', // Spacing between messages/groups
  },

  // --- Message Bubbles ---
  messageBubbleWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    maxWidth: '75%', // Allow slightly wider bubbles
    gap: '4px', // Space between consecutive bubbles from same sender (if grouped later)
    alignSelf: 'flex-start',
    position: 'relative' as const, // Needed for Framer Motion layout animations
  },
  messageBubbleWrapperUser: {
    alignSelf: 'flex-end',
  },
  messageBubbleBase: {
    padding: '10px 16px',
    borderRadius: '18px', // Consistent rounding
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    width: 'fit-content', // Important for bubble size
    fontSize: '15px',
    lineHeight: '1.6',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
    position: 'relative', // For potential pseudo-elements or tooltips
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    border: '1px solid rgba(255, 255, 255, 0.08)', // Subtle border for glass effect
  },
  messageBubbleAssistant: {
    backgroundColor: 'rgba(37, 38, 43, 0.6)', // Semi-transparent BG
    color: 'var(--mantine-color-gray-1)',
    borderTopLeftRadius: '6px', // Slightly sharper corner towards edge
    alignSelf: 'flex-start',
    backdropFilter: 'blur(12px)', // Glassmorphism
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  messageBubbleUser: {
    background: 'linear-gradient(135deg, var(--mantine-color-blue-7), var(--mantine-color-blue-6))', // Updated gradient
    color: 'white',
    borderTopRightRadius: '6px', // Slightly sharper corner towards edge
    alignSelf: 'flex-end',
    boxShadow: '0 3px 8px rgba(var(--mantine-color-blue-6-rgb), 0.3)',
  },
  messageText: { // Style for text inside bubbles (if needed)
    fontSize: '15px',
    lineHeight: '1.6',
  },
  messageTimestamp: {
    fontSize: '10px',
    color: 'var(--mantine-color-gray-5)',
    alignSelf: 'flex-end', // Position timestamp correctly
    marginTop: '4px',
    opacity: 0.7,
  },

  // --- Input Area ---
  inputContainer: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    // Gradient fade effect above input
    '&::before': {
      content: '""',
      position: 'absolute',
      bottom: '100%', // Position right above the container
      left: 0,
      right: 0,
      height: '80px', // Height of the fade
      background: 'linear-gradient(to top, rgba(var(--mantine-color-dark-9-rgb), 0.95), transparent)',
      pointerEvents: 'none',
      zIndex: -1,
    },
  },
  inputInner: {
    maxWidth: '1000px', // Match message container width
    margin: '0 auto',
    padding: '16px 20px 20px 20px', // Adjust padding
    backgroundColor: 'rgba(26, 27, 30, 0.7)', // Glassmorphism BG
    backdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: '16px', // Rounded top corners
    borderTopRightRadius: '16px',
    boxShadow: '0 -5px 25px rgba(0, 0, 0, 0.2)',
  },
  // Styles for the TextInput itself
  textInputRoot: { // Target Mantine's root element if needed
    // Example: border: 'none',
  },
  textInputInput: { // Target Mantine's input element
    backgroundColor: 'rgba(var(--mantine-color-dark-5-rgb), 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--mantine-color-gray-1)',
    minHeight: '46px', // Make input slightly taller
    paddingRight: '85px', // Ensure space for icons
    '&:focus': {
      borderColor: 'rgba(var(--mantine-color-blue-5-rgb), 0.5)',
      boxShadow: '0 0 0 2px rgba(var(--mantine-color-blue-5-rgb), 0.2)',
    },
    '&::placeholder': {
      color: 'var(--mantine-color-gray-5)',
    },
  },
  inputActions: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
  },

  // --- Chat Shelf ---
  shelfHoverZone: {
    position: 'fixed',
    left: 0,
    top: '60px', // Adjust based on your header height
    bottom: 0,
    width: '16px', // Wider hover zone for easier activation
    zIndex: 150, // Above chat area, below open shelf
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfHoverIndicator: {
    width: '4px',
    height: '40px',
    backgroundColor: 'rgba(var(--mantine-color-gray-6-rgb), 0.5)',
    borderRadius: '2px',
    transition: 'all 0.3s ease',
  },
  shelfHoverZoneHover: { // Style for when hovering the zone
    '& $shelfHoverIndicator': { // Target child indicator
      backgroundColor: 'rgba(var(--mantine-color-blue-5-rgb), 0.8)',
      boxShadow: '0 0 8px rgba(var(--mantine-color-blue-5-rgb), 0.5)',
    }
  },
  shelf: {
    position: 'fixed' as const,
    top: '60px', // Match hover zone top
    left: 0,
    bottom: 0,
    width: '300px', // Slightly narrower shelf
    zIndex: 200, // Highest z-index when open
    backgroundColor: 'rgba(26, 27, 30, 0.75)', // Glassmorphism BG
    backdropFilter: 'blur(18px)', // Stronger blur for shelf
    boxShadow: '5px 0 30px rgba(0, 0, 0, 0.3)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    // transform will be handled by Framer Motion
    display: 'flex',
    flexDirection: 'column' as const,
  },
  shelfContent: {
    flex: 1,
    padding: '12px 8px 12px 12px', // Adjusted padding
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    // Custom scrollbar for shelf
    '&::-webkit-scrollbar': { width: '5px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255, 255, 255, 0.25)' },
  },
  newChatButton: {
    margin: '8px 4px 16px 4px', // Give it some space
    backgroundColor: 'rgba(var(--mantine-color-dark-6-rgb), 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(var(--mantine-color-dark-5-rgb), 0.7)',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
  },
  chatTab: {
    borderRadius: '8px',
    padding: '10px 12px',
    margin: '4px', // Add margin around tabs
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    border: '1px solid transparent',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    backgroundColor: 'rgba(var(--mantine-color-dark-5-rgb), 0.2)',
    // Subtle left border indicator on hover/active (instead of ::before)
    borderLeft: '3px solid transparent',
    '&:hover': {
      backgroundColor: 'rgba(var(--mantine-color-dark-4-rgb), 0.4)',
      borderLeftColor: 'rgba(var(--mantine-color-gray-5-rgb), 0.5)',
      // Show icons on hover
      '& $chatTabActions': {
        opacity: 1,
        transform: 'translateX(0)',
      }
    },
  },
  chatTabActive: {
    backgroundColor: 'rgba(var(--mantine-color-blue-8-rgb), 0.3)',
    borderLeftColor: 'var(--mantine-color-blue-5)',
    // Show icons always when active
    '& $chatTabActions': {
      opacity: 1,
      transform: 'translateX(0)',
    }
  },
  chatTabContent: { // Wrapper for text content inside tab
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  chatTabHeader: { // Group title and actions
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  chatTabTitleGroup: { // Group icon and title text
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden', // Prevent long titles pushing out actions
  },
  chatTabTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--mantine-color-gray-1)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatTabSubtitle: {
    fontSize: '12px',
    color: 'var(--mantine-color-gray-4)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatTabTimestamp: {
    fontSize: '10px',
    color: 'var(--mantine-color-gray-5)',
    marginTop: '4px',
    opacity: 0.8,
  },
  chatTabActions: {
    display: 'flex',
    gap: '2px',
    opacity: 0, // Hide by default
    transform: 'translateX(5px)', // Slight offset for transition
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    // Ensure actions don't wrap
    flexShrink: 0,
  },
  dateDividerChat: {
    padding: '16px 12px 6px 12px',
    color: 'var(--mantine-color-gray-5)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    opacity: 0.8,
  },

  // --- Empty State / Greeting ---
  emptyStateContainer: {
    // Takes full available space in the chat area before messages appear
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '32px',
    minHeight: 'calc(100vh - 250px)', // Adjust based on header/input height
  },
  emptyStateIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(var(--mantine-color-teal-7-rgb), 0.1), rgba(var(--mantine-color-blue-7-rgb), 0.15))',
    boxShadow: '0 0 20px rgba(var(--mantine-color-teal-6-rgb), 0.2)',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  emptyStateGreeting: {
    fontSize: '22px', // Larger greeting
    fontWeight: 600,
    color: 'var(--mantine-color-gray-1)',
    marginBottom: '8px',
  },
  emptyStatePrompt: {
    fontSize: '15px',
    color: 'var(--mantine-color-gray-4)',
    maxWidth: '450px',
    lineHeight: 1.6,
  },

  // --- Misc ---
  thinkingAnimationContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align left for assistant
    padding: '10px 16px', // Match bubble padding
    marginLeft: '10px', // Indent slightly
  },

} as const;