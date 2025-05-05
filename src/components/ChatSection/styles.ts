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
        backgroundColor: 'var(--mantine-color-dark-9)',
        backgroundImage: `
      radial-gradient(circle at 100% 100%, rgba(var(--mantine-color-teal-9-rgb), 0.1) 0%, transparent 40%),
      radial-gradient(circle at 0% 0%, rgba(var(--mantine-color-blue-9-rgb), 0.08) 0%, transparent 40%)
    `,
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
            background: 'linear-gradient(to top, rgba(var(--mantine-color-dark-8-rgb), 0.95), transparent)',
            pointerEvents: 'none', zIndex: -1,
        },
    },
    inputInner: {
        maxWidth: '840px',
        margin: '0 auto',
        position: 'relative',
        padding: '8px 8px 8px 16px',
        backgroundColor: 'rgba(var(--mantine-color-dark-5-rgb), 0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
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
        minHeight: 'calc(100vh - 250px)'
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

    
    shelfTrigger: {
        position: 'fixed' as const, left: '0px', top: '60px', bottom: '0px', width: '32px',
        zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        transition: 'background-color 0.3s ease',
        '&:hover': {'& > svg': {color: 'var(--mantine-color-blue-4)', transform: 'scale(1.1)'}},
    },
    shelfTriggerIcon: {
        color: 'var(--mantine-color-gray-6)', transition: 'all 0.3s ease', marginLeft: '-8px',
    },
    shelf: {
        position: 'fixed' as const, top: '60px', left: '0', bottom: '0', width: '300px', zIndex: 200,
        display: 'flex', flexDirection: 'column' as const,
        background: 'rgba(var(--mantine-color-dark-8-rgb), 0.75)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '5px 0px 25px rgba(0, 0, 0, 0.2)',
        willChange: 'transform',
    },
    shelfContent: {flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden'},
    shelfHeader: {padding: '12px 12px 8px 12px', flexShrink: 0},
    shelfList: {flex: 1, padding: '0px 4px 12px 12px'},
    newChatButton: {
        backgroundColor: 'rgba(var(--mantine-color-dark-6-rgb), 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)',
        fontWeight: 500, transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: 'rgba(var(--mantine-color-dark-5-rgb), 0.7)',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
        },
    },
    dateDividerChat: {
        padding: '16px 8px 6px 8px', color: 'var(--mantine-color-gray-5)', fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.8px', textTransform: 'uppercase' as const, opacity: 0.9,
    },
    chatTab: {
        display: 'flex',
        flexDirection: 'column' as const,
        borderRadius: '8px',
        padding: '10px 12px',
        margin: '4px 8px 4px 0px',
        cursor: 'pointer',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        '&[data-active="true"]': {
            backgroundColor: 'rgba(var(--mantine-color-blue-8-rgb), 0.25)',
            borderColor: 'rgba(var(--mantine-color-blue-6-rgb), 0.5)'
        },
        '&:hover': {
            backgroundColor: 'rgba(var(--mantine-color-dark-5-rgb), 0.4)',
            '& $chatTabActions': {opacity: 1, transform: 'translateX(0)'}
        },
    },
    chatTabHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: '4px'
    },
    chatTabTitleGroup: {display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, overflow: 'hidden'},
    chatTabIcon: {flexShrink: 0, opacity: 0.7, color: 'var(--mantine-color-gray-3)'},
    chatTabIconActive: {opacity: 1, color: 'var(--mantine-color-blue-4)'},
    chatTabTitle: {
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--mantine-color-gray-1)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    chatTabSubtitle: {
        fontSize: '12px',
        color: 'var(--mantine-color-gray-4)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        paddingLeft: '24px',
        marginBottom: '4px'
    },
    chatTabFooter: {display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '4px'},
    chatTabTimestamp: {fontSize: '10px', color: 'var(--mantine-color-gray-5)', opacity: 0.8},
    chatTabActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '0px',
        opacity: 0,
        transform: 'translateX(5px)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        flexShrink: 0
    },

} as const;