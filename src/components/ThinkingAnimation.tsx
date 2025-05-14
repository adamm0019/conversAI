import React from 'react';
import { Box, Group, Text } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassUI } from './GlassUI/GlassUI.tsx';

interface ThinkingAnimationProps {
    text?: string;
    dotsCount?: number;
    style?: React.CSSProperties;
    variant?: 'dots' | 'pulse' | 'wave' | 'rings';
}

export const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({
    text = 'AI is thinking',
    dotsCount = 3,
    style,
    variant = 'dots'
}) => {

    const DotsAnimation = () => (
        <Group gap={8} ml={4}>
            {Array.from({ length: dotsCount }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0.3, scale: 0.8 }}
                    animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                    }}
                >
                    <Box
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, var(--mantine-color-primary-4) 0%, var(--mantine-color-primary-6) 100%)`,
                            boxShadow: '0 0 6px rgba(25, 118, 210, 0.4)'
                        }}
                    />
                </motion.div>
            ))}
        </Group>
    );


    const PulseAnimation = () => (
        <Box ml={8} style={{ position: 'relative', width: 28, height: 24 }}>
            <AnimatePresence>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 10,
                            height: 10,
                            backgroundColor: 'var(--mantine-color-primary-5)',
                            borderRadius: '50%',
                        }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: [0.7, 0],
                            scale: [0.5, 1.5],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: "easeOut"
                        }}
                    />
                ))}
            </AnimatePresence>

            <motion.div
                style={{
                    position: 'absolute',
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 6,
                    height: 6,
                    backgroundColor: 'var(--mantine-color-primary-4)',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(25, 118, 210, 0.6)'
                }}
                animate={{
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </Box>
    );


    const WaveAnimation = () => (
        <Group gap={4} ml={8} mt={2}>
            {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                    key={i}
                    style={{
                        width: 3,
                        height: 16,
                        backgroundColor: 'var(--mantine-color-primary-5)',
                        borderRadius: 2,
                    }}
                    animate={{
                        height: [10, 16, 10],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </Group>
    );


    const RingsAnimation = () => (
        <Box ml={8} style={{ position: 'relative', width: 28, height: 24 }}>
            <motion.div
                style={{
                    position: 'absolute',
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 16,
                    height: 16,
                    border: '2px solid var(--mantine-color-primary-5)',
                    borderRadius: '50%',
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                }}
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 10,
                    height: 10,
                    border: '2px solid var(--mantine-color-primary-3)',
                    borderRadius: '50%',
                    borderTopColor: 'transparent',
                    borderBottomColor: 'transparent',
                }}
                animate={{
                    rotate: -360,
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        </Box>
    );


    const renderAnimation = () => {
        switch (variant) {
            case 'pulse':
                return <PulseAnimation />;
            case 'wave':
                return <WaveAnimation />;
            case 'rings':
                return <RingsAnimation />;
            case 'dots':
            default:
                return <DotsAnimation />;
        }
    };

    return (
        <GlassUI
            p="sm"
            radius="xl"
            blurStrength={15}
            style={{
                display: 'inline-flex',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                ...style
            }}
        >
            <Group align="center" gap="xs">
                <Text size="sm" c="dimmed" fw={500}>{text}</Text>
                {renderAnimation()}
            </Group>
        </GlassUI>
    );
};

export default ThinkingAnimation;