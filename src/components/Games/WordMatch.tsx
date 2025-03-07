import React, { useState, useEffect } from 'react';
import {
    Stack,
    Paper,
    Group,
    Text,
    SimpleGrid,
    Card,
    Badge,
    Button,
    ActionIcon
} from '@mantine/core';
import { IconX, IconDoorExit, IconClock } from '@tabler/icons-react';

interface WordPair {
    word: string;
    translation: string;
}

const wordPairs: WordPair[] = [
    { word: 'casa', translation: 'house' },
    { word: 'perro', translation: 'dog' },
    { word: 'gato', translation: 'cat' },
    { word: 'libro', translation: 'book' },
    { word: 'mesa', translation: 'table' },
    { word: 'silla', translation: 'chair' },
    { word: 'agua', translation: 'water' },
    { word: 'pan', translation: 'bread' },
];

interface WordMatchProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

export const WordMatch: React.FC<WordMatchProps> = ({ onClose, onGameComplete }) => {
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [gameComplete, setGameComplete] = useState(false);
    const [timeLeft, setTimeLeft] = useState(45);

    const shuffledWords = React.useMemo(() => {
        const words = [...wordPairs.map(p => p.word), ...wordPairs.map(p => p.translation)];
        return words.sort(() => Math.random() - 0.5);
    }, []);

    useEffect(() => {
        if (timeLeft <= 0 || gameComplete) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1 && !gameComplete) {
                    clearInterval(timer);
                    onGameComplete(score);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, gameComplete, score, onGameComplete]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleWordClick = (word: string) => {
        if (selectedWords.includes(word) || matchedPairs.includes(word) || timeLeft <= 0) return;

        const newSelected = [...selectedWords, word];
        setSelectedWords(newSelected);

        if (newSelected.length === 2) {
            const [first, second] = newSelected;
            const isMatch = wordPairs.some(
                pair => (pair.word === first && pair.translation === second) ||
                    (pair.translation === first && pair.word === second)
            );

            if (isMatch) {
                setMatchedPairs([...matchedPairs, first, second]);
                setScore(prev => prev + 100);

                if (matchedPairs.length + 2 === shuffledWords.length) {
                    setGameComplete(true);
                    onGameComplete(score + 100);
                }
            }

            setTimeout(() => {
                setSelectedWords([]);
            }, 1000);
        }
    };

    const getWordStatus = (word: string) => {
        if (matchedPairs.includes(word)) return 'matched';
        if (selectedWords.includes(word)) return 'selected';
        return 'default';
    };

    return (
        <Stack>
            <Paper
                p="md"
                radius="md"
                bg="dark.7"
                style={{
                    border: '1px solid #2C2E33'
                }}
            >
                <Group align="center">
                    <Group>
                        <Group>
                            <Text size="xl" fw={700} c="white">Score: {score}</Text>
                            {gameComplete && (
                                <Badge size="lg" color="green" variant="light">
                                    Game Complete!
                                </Badge>
                            )}
                        </Group>
                        <Group>
                            <IconClock size="1.2rem" style={{ color: timeLeft <= 30 ? '#EF4444' : '#A1A1AA' }} />
                            <Text
                                size="xl"
                                fw={700}
                                c={timeLeft <= 30 ? 'red' : 'dimmed'}
                            >
                                {formatTime(timeLeft)}
                            </Text>
                        </Group>
                    </Group>
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        onClick={onClose}
                    >
                        <IconX size="1.2rem" />
                    </ActionIcon>
                </Group>
            </Paper>

            <SimpleGrid cols={4} spacing="md">
                {shuffledWords.map((word, index) => {
                    const status = getWordStatus(word);
                    return (
                        <Card
                            key={`${word}-${index}`}
                            p={0}
                            radius="md"
                            style={{
                                cursor: status === 'matched' || timeLeft <= 0 ? 'default' : 'pointer',
                                transform: status === 'selected' ? 'scale(1.02)' : 'scale(1)',
                                transition: 'all 0.2s ease',
                            }}
                            onClick={() => handleWordClick(word)}
                        >
                            <Paper
                                p="xl"
                                radius="md"
                                style={{
                                    backgroundColor:
                                        timeLeft <= 0 ? '#1E1E1E' :
                                            status === 'matched' ? '#1C7A50' :
                                                status === 'selected' ? '#2C5282' :
                                                    '#25262B',
                                    border: `1px solid ${timeLeft <= 0 ? '#2C2E33' :
                                            status === 'matched' ? '#22C55E' :
                                                status === 'selected' ? '#3B82F6' :
                                                    '#2C2E33'
                                        }`,
                                    height: '120px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Text
                                    fw={500}
                                    size="lg"
                                    c={status === 'matched' ? 'gray.3' : 'white'}
                                    style={{
                                        opacity: timeLeft <= 0 ? 0.5 :
                                            status === 'matched' ? 0.9 : 1,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {word}
                                </Text>
                            </Paper>
                        </Card>
                    );
                })}
            </SimpleGrid>

            <Group mt="xl">
                <Button
                    color="red"
                    variant="light"
                    size="md"
                    onClick={onClose}
                >
                    <IconDoorExit size="1.2rem" style={{ marginRight: '8px' }} /> Exit Game
                </Button>
            </Group>
        </Stack>
    );
};