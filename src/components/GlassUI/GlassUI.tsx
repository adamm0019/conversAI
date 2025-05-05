import React, { ReactNode } from 'react';
import { Paper, PaperProps, Box } from '@mantine/core';
import { motion } from 'framer-motion';

interface GlassUIProps extends PaperProps {
    children: ReactNode;
    blurStrength?: number;
    opacity?: number;
    borderOpacity?: number;
    withHover?: boolean;
    withFloating?: boolean;
    animate?: boolean;
    borderColor?: string;
    background?: string;
}

export const GlassUI: React.FC<GlassUIProps> = ({
                                                    children,
                                                    blurStrength = 10,
                                                    opacity = 0.7,
                                                    borderOpacity = 0.1,
                                                    withHover = false,
                                                    withFloating = false,
                                                    animate = false,
                                                    borderColor = "rgba(255, 255, 255, 0.1)",
                                                    background = "rgba(37, 38, 43, 0.7)",
                                                    ...props
                                                }) => {
    const style = {
        background,
        backdropFilter: `blur(${blurStrength}px)`,
        WebkitBackdropFilter: `blur(${blurStrength}px)`,
        border: `1px solid ${borderColor}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(withHover && {
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                border: `1px solid rgba(255, 255, 255, 0.2)`,
            }
        }),
        ...props.style
    };

    const GlassComponent = (
        <Paper radius="lg" {...props} style={style}>
            {children}
        </Paper>
    );

    if (animate) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {GlassComponent}
            </motion.div>
        );
    }

    if (withFloating) {
        return (
            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                {GlassComponent}
            </motion.div>
        );
    }

    return GlassComponent;
};

export const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
        }
    })
};

export const AnimatedBackground: React.FC<{children: ReactNode}> = ({ children }) => {
    return (
        <Box
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.95), rgba(32, 33, 37, 0.95))',
                backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(25, 118, 210, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(37, 38, 43, 0.1) 0%, transparent 50%)',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="particles">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="particle"
                        style={{
                            position: 'absolute',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            width: Math.random() * 10 + 5,
                            height: Math.random() * 10 + 5,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, Math.random() * -100 - 50],
                            x: [0, Math.random() * 50 - 25],
                            opacity: [0.1, 0.3, 0],
                        }}
                        transition={{
                            duration: Math.random() * 20 + 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>
            {children}
        </Box>
    );
};


export const glassStyles = {
    
    glassLight: {
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    glassDark: {
        background: 'rgba(26, 27, 30, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
    },

    
    shadowSm: '0 2px 6px rgba(0, 0, 0, 0.1)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.15)',
    shadowLg: '0 8px 20px rgba(0, 0, 0, 0.2)',
    shadowInner: 'inset 0 2px 6px rgba(0, 0, 0, 0.15)',

    
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
    },

    
    radius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        round: '50%',
    },

    
    transition: {
        fast: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        normal: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    }
};