import {keyframes} from '@emotion/react';


export const slideIn = keyframes`from {
                                     opacity: 0;
                                     transform: translateY(20px);
                                 }
                                     to {
                                         opacity: 1;
                                         transform: translateY(0);
                                     }`;
export const slideInLeft = keyframes`from {
                                         opacity: 0;
                                         transform: translateX(-20px);
                                     }
                                         to {
                                             opacity: 1;
                                             transform: translateX(0);
                                         }`;
export const slideInRight = keyframes`from {
                                          opacity: 0;
                                          transform: translateX(20px);
                                      }
                                          to {
                                              opacity: 1;
                                              transform: translateX(0);
                                          }`;
export const fadeIn = keyframes`from {
                                    opacity: 0;
                                }
                                    to {
                                        opacity: 1;
                                    }`;
export const pulseAnimation = keyframes`
    0% {
        transform: scale(1);
        opacity: 0.7;
    }
    50% {
        transform: scale(1.1);
        opacity: 1;
    }
    100% {
        transform: scale(1);
        opacity: 0.7;
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
        backgroundImage: 'radial-gradient(circle at 25% 100%, rgba(var(--mantine-color-blue-9-rgb), 0.12), transparent 25%), radial-gradient(circle at 80% 20%, rgba(var(--mantine-color-indigo-6-rgb), 0.12), transparent 35%)',
        backgroundAttachment: 'fixed',
    },

    
    chatArea: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '20px',
        paddingBottom: '150px', 
        scrollBehavior: 'smooth' as const,
        '&::-webkit-scrollbar': {width: '6px'},
        '&::-webkit-scrollbar-track': {background: 'transparent'},
        '&::-webkit-scrollbar-thumb': {background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px'},
        '&::-webkit-scrollbar-thumb:hover': {background: 'rgba(255, 255, 255, 0.2)'},
        backgroundColor: 'transparent',
    },

    messageContainer: {
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },

    
    messageBubbleWrapper: {
        display: 'flex',
        flexDirection: 'column' as const,
        maxWidth: '75%',
        gap: '4px',
        alignSelf: 'flex-start',
        position: 'relative' as const
    },
    messageBubbleWrapperUser: {alignSelf: 'flex-end'},
    messageBubbleBase: {
        padding: '10px 16px',
        borderRadius: '18px',
        wordBreak: 'break-word' as const,
        whiteSpace: 'pre-wrap' as const,
        width: 'fit-content',
        fontSize: '15px',
        lineHeight: '1.6',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.08)'
    },
    messageBubbleAssistant: {
        backgroundColor: 'rgba(37, 38, 43, 0.6)',
        color: 'var(--mantine-color-gray-1)',
        borderTopLeftRadius: '6px',
        alignSelf: 'flex-start',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    messageBubbleUser: {
        background: 'linear-gradient(135deg, var(--mantine-color-blue-7), var(--mantine-color-blue-6))',
        color: 'white',
        borderTopRightRadius: '6px',
        alignSelf: 'flex-end',
        boxShadow: '0 3px 8px rgba(var(--mantine-color-blue-6-rgb), 0.3)'
    },
    messageText: {fontSize: '15px', lineHeight: '1.6'},
    messageTimestamp: {
        fontSize: '10px',
        color: 'var(--mantine-color-gray-5)',
        alignSelf: 'flex-end',
        marginTop: '4px',
        opacity: 0.7,
        cursor: 'help'
    },
    messageAudio: {marginTop: '8px', position: 'relative'},

    
    thinkingAnimationContainer: {
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        padding: '10px 16px', marginLeft: '10px',
    },

    
    inputContainer: {
        position: 'relative', zIndex: 100, paddingTop: '40px', paddingBottom: '24px',
        paddingLeft: 'var(--mantine-spacing-md)', paddingRight: 'var(--mantine-spacing-md)',
        '&::before': {
            content: '""', position: 'absolute', bottom: 'calc(100% - 40px)', left: 0, right: 0, height: '80px',
            background: 'linear-gradient(to top, rgba(20, 20, 23, 0.7), transparent)',
            pointerEvents: 'none', zIndex: -1,
        },
    },
    inputInner: {
        maxWidth: '840px',
        margin: '0 auto',
        position: 'relative',
        padding: '8px 8px 8px 16px',
        backgroundColor: 'rgba(30, 31, 40, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
    },
    textInputInput: {
        backgroundColor: 'transparent', border: 'none', color: 'var(--mantine-color-gray-1)',
        minHeight: '40px', padding: '10px 0', fontSize: '15px', lineHeight: '1.5', flex: 1,
        resize: 'none' as const, boxShadow: 'none !important',
        '&::placeholder': {color: 'var(--mantine-color-gray-5)', opacity: 0.8},
        scrollbarWidth: 'none', '&::-webkit-scrollbar': {display: 'none'},
    },
    inputActions: {
        display: 'flex', alignItems: 'center', gap: '4px', paddingBottom: '4px',
    },

    
    emptyStateContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '32px',
        minHeight: 'calc(100vh - 250px)',
        backgroundColor: 'transparent',
        position: 'relative',
        zIndex: 5
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
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    emptyStateGreeting: {fontSize: '22px', fontWeight: 600, color: 'var(--mantine-color-gray-1)', marginBottom: '8px'},
    emptyStatePrompt: {fontSize: '15px', color: 'var(--mantine-color-gray-4)', maxWidth: '450px', lineHeight: 1.6},

} as const;