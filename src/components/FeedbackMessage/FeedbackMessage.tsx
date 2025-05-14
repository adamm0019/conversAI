import React from 'react';
import { FeedbackType, PronunciationFeedback } from '../../services/AzurePronunciationService';
import { Box, Text, Group, RingProgress, Badge, Progress, ThemeIcon, Paper } from '@mantine/core';
import { motion } from 'framer-motion';
import {
    IconCircleCheck,
    IconAlertTriangle,
    IconVocabulary,
    IconAbc,
    IconFlame,
    IconTrophy,
    IconBulb,
    IconMicrophone,
    IconCheck,
    IconX,
    IconClockPlay
} from '@tabler/icons-react';
import { GlassUI, glassStyles } from '../GlassUI/GlassUI';

interface FeedbackMessageProps {
    feedback: PronunciationFeedback;
    style?: React.CSSProperties;
}


const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.2,
            ease: "easeInOut"
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 }
    }
};

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ feedback, style }) => {
    
    const getFeedbackColor = (type: FeedbackType): string => {
        switch(type) {
            case FeedbackType.PERFECT:
                return 'green';
            case FeedbackType.GOOD:
                return 'blue';
            case FeedbackType.NEEDS_IMPROVEMENT:
                return 'orange';
            case FeedbackType.STREAK:
                return 'orange';
            case FeedbackType.ACHIEVEMENT:
                return 'violet';
            case FeedbackType.GRAMMAR:
                return 'indigo';
            case FeedbackType.VOCABULARY:
                return 'cyan';
            case FeedbackType.FLUENCY:
                return 'blue';
            case FeedbackType.TIP:
                return 'yellow';
            case FeedbackType.ENCOURAGEMENT:
                return 'green';
            case FeedbackType.CHALLENGE:
                return 'red';
            default:
                return 'blue';
        }
    };

    
    const getFeedbackIcon = (type: FeedbackType) => {
        switch(type) {
            case FeedbackType.PERFECT:
                return <IconCircleCheck size={20} />;
            case FeedbackType.GOOD:
                return <IconCheck size={20} />;
            case FeedbackType.NEEDS_IMPROVEMENT:
                return <IconAlertTriangle size={20} />;
            case FeedbackType.STREAK:
                return <IconFlame size={20} />;
            case FeedbackType.ACHIEVEMENT:
                return <IconTrophy size={20} />;
            case FeedbackType.GRAMMAR:
                return <IconAbc size={20} />;
            case FeedbackType.VOCABULARY:
                return <IconVocabulary size={20} />;
            case FeedbackType.FLUENCY:
                return <IconClockPlay size={20} />;
            case FeedbackType.TIP:
                return <IconBulb size={20} />;
            case FeedbackType.ENCOURAGEMENT:
                return <IconCheck size={20} />;
            case FeedbackType.CHALLENGE:
                return <IconMicrophone size={20} />;
            default:
                return <IconBulb size={20} />;
        }
    };

    
    const color = getFeedbackColor(feedback.type);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
        >
            <GlassUI
                withHover={false}
                p="md"
                radius="lg"
                blurStrength={8}
                animate={false}
                style={{
                    border: `1px solid var(--mantine-color-${color}-5)`,
                    boxShadow: `0 4px 12px rgba(var(--mantine-color-${color}-rgb), 0.15)`,
                    ...style
                }}
            >
                <Group gap="xs" align="flex-start">
                    <ThemeIcon
                        color={color}
                        size="lg"
                        radius="xl"
                        variant="light"
                    >
                        {getFeedbackIcon(feedback.type)}
                    </ThemeIcon>

                    <Box style={{ flex: 1 }}>
                        <motion.div variants={itemVariants}>
                            <Text fw={600} size="sm" c={color} mb={3}>
                                {feedback.message}
                            </Text>
                        </motion.div>

                        
                        {feedback.details && (
                            <motion.div variants={itemVariants}>
                                <Text size="xs" c="dimmed">
                                    {feedback.details}
                                </Text>
                            </motion.div>
                        )}

                        
                        {feedback.problemWords && feedback.problemWords.length > 0 && (
                            <motion.div variants={itemVariants}>
                                <Group gap="xs" mt={8} wrap="wrap">
                                    {feedback.problemWords.map((word, index) => (
                                        <Badge
                                            key={index}
                                            color={word.accuracyScore > 50 ? 'yellow' : 'red'}
                                            variant="light"
                                            size="sm"
                                        >
                                            {word.word}
                                        </Badge>
                                    ))}
                                </Group>
                            </motion.div>
                        )}

                        
                        {feedback.suggestion && (
                            <motion.div variants={itemVariants}>
                                <Group gap="xs" mt={8} align="center">
                                    <IconBulb size={16} color="var(--mantine-color-yellow-5)" />
                                    <Text size="xs" fs={"italic"}>
                                        {feedback.suggestion}
                                    </Text>
                                </Group>
                            </motion.div>
                        )}

                        
                        {feedback.scores && (
                            <motion.div variants={itemVariants}>
                                <Box mt={10}>
                                    {feedback.scores.pronunciation !== undefined && (
                                        <Group gap="xs" mb={6}>
                                            <Text size="xs" fw={500} w={80}>Pronunciation:</Text>
                                            <Progress
                                                value={feedback.scores.pronunciation}
                                                color={feedback.scores.pronunciation > 80 ? 'green' :
                                                    feedback.scores.pronunciation > 60 ? 'blue' : 'orange'}
                                                size="sm"
                                                radius="xl"
                                                style={{ flex: 1 }}
                                            />
                                            <Text size="xs" fw={500}>{Math.round(feedback.scores.pronunciation)}%</Text>
                                        </Group>
                                    )}
                                    {feedback.scores.fluency !== undefined && (
                                        <Group gap="xs" mb={6}>
                                            <Text size="xs" fw={500} w={80}>Fluency:</Text>
                                            <Progress
                                                value={feedback.scores.fluency}
                                                color={feedback.scores.fluency > 80 ? 'green' :
                                                    feedback.scores.fluency > 60 ? 'blue' : 'orange'}
                                                size="sm"
                                                radius="xl"
                                                style={{ flex: 1 }}
                                            />
                                            <Text size="xs" fw={500}>{Math.round(feedback.scores.fluency)}%</Text>
                                        </Group>
                                    )}
                                    {feedback.scores.accuracy !== undefined && (
                                        <Group gap="xs" mb={6}>
                                            <Text size="xs" fw={500} w={80}>Accuracy:</Text>
                                            <Progress
                                                value={feedback.scores.accuracy}
                                                color={feedback.scores.accuracy > 80 ? 'green' :
                                                    feedback.scores.accuracy > 60 ? 'blue' : 'orange'}
                                                size="sm"
                                                radius="xl"
                                                style={{ flex: 1 }}
                                            />
                                            <Text size="xs" fw={500}>{Math.round(feedback.scores.accuracy)}%</Text>
                                        </Group>
                                    )}
                                    {feedback.scores.completeness !== undefined && (
                                        <Group gap="xs">
                                            <Text size="xs" fw={500} w={80}>Completeness:</Text>
                                            <Progress
                                                value={feedback.scores.completeness}
                                                color={feedback.scores.completeness > 80 ? 'green' :
                                                    feedback.scores.completeness > 60 ? 'blue' : 'orange'}
                                                size="sm"
                                                radius="xl"
                                                style={{ flex: 1 }}
                                            />
                                            <Text size="xs" fw={500}>{Math.round(feedback.scores.completeness)}%</Text>
                                        </Group>
                                    )}
                                </Box>
                            </motion.div>
                        )}
                    </Box>
                </Group>
            </GlassUI>
        </motion.div>
    );
};

export default FeedbackMessage;