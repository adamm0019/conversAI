import React from 'react';
import { Center, Text, Stack } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconMessageCircle } from '@tabler/icons-react';
import { styles } from '../ChatSection/styles.ts';

interface EmptyStateProps {
    userName?: string;
}

const pulse = {
    animate: {
        scale: [1, 1.06, 1],
        opacity: [0.7, 1, 0.7],
    },
    transition: {
        duration: 2,
        ease: 'easeInOut',
        repeat: Infinity,
    },
};

const EmptyState: React.FC<EmptyStateProps> = ({ userName }) => {
    const greeting = `🌅 Good ${getTimeOfDay()}, ${userName || 'friend'}`;

    return (
        <Center style={styles.emptyStateContainer}>
            <Stack align="center" m="md">
                <motion.div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(56, 163, 165, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 12px rgba(56, 163, 165, 0.3)',
                        backdropFilter: 'blur(8px)',
                    }}
                    {...pulse}
                >
                    <IconMessageCircle size={32} stroke={1.5} color="#38a3a5" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <Text size="xl" fw={600} c="gray.3">
                        {greeting}
                    </Text>
                    <Text size="sm" c="dimmed" ta="center" maw={500}>
                        Ready to practice your skills or ask a question.
                    </Text>
                </motion.div>
            </Stack>
        </Center>
    );
};

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
}

export default EmptyState;
