import React from 'react';
import { Center, Text, Stack } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconSparkles } from '@tabler/icons-react'; 
import { styles } from '../ChatSection/styles.ts'; 

interface EmptyStateProps {
    userName?: string;
}

const iconVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.2,
        },
    },
    hover: {
        scale: 1.1,
        rotate: 10,
        transition: { duration: 0.3 }
    }
};

const textVariants = {
    initial: { y: 20, opacity: 0 },
    animate: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut', delay: 0.4 }
    }
};

const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
};

const EmptyState: React.FC<EmptyStateProps> = ({ userName }) => {
    const greeting = `Good ${getTimeOfDay()}, ${userName || 'friend'}!`;

    return (
        <Center style={styles.emptyStateContainer}>
            <Stack align="center" gap="lg">
                <motion.div
                    style={styles.emptyStateIconWrapper}
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                >
                    <Text size={"40"}>👋</Text>
                </motion.div>

                <motion.div variants={textVariants} initial="initial" animate="animate">
                    <Text style={styles.emptyStateGreeting}>
                        {greeting}
                    </Text>
                    <Text style={styles.emptyStatePrompt}>
                        How can I assist you with your language learning today?
                    </Text>
                </motion.div>
            </Stack>
        </Center>
    );
};

export default EmptyState;