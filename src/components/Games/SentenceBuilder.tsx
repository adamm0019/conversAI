import React, { useState, useEffect } from 'react';
import {
    Stack,
    Paper,
    Group,
    Text,
    Badge,
    Button,
    ActionIcon,
    Flex,
    Card,
    Box,
    Progress
} from '@mantine/core';
import { IconX, IconDoorExit, IconClock, IconArrowsShuffle, IconCheck } from '@tabler/icons-react';

interface SentenceBuilderProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

interface SentenceChallenge {
    id: number;
    words: string[];
    correctSentence: string;
    translation: string;
    completed: boolean;
}


const challenges: SentenceChallenge[] = [
    {
        id: 1,
        words: ['Yo', 'quiero', 'aprender', 'español', 'hoy'],
        correctSentence: 'Yo quiero aprender español hoy',
        translation: 'I want to learn Spanish today',
        completed: false
    },
    {
        id: 2,
        words: ['¿Dónde', 'está', 'la', 'biblioteca', '?'],
        correctSentence: '¿Dónde está la biblioteca?',
        translation: 'Where is the library?',
        completed: false
    },
    {
        id: 3,
        words: ['Me', 'gusta', 'comer', 'en', 'este', 'restaurante'],
        correctSentence: 'Me gusta comer en este restaurante',
        translation: 'I like to eat at this restaurant',
        completed: false
    },
    {
        id: 4,
        words: ['Ella', 'va', 'a', 'la', 'playa', 'mañana'],
        correctSentence: 'Ella va a la playa mañana',
        translation: 'She is going to the beach tomorrow',
        completed: false
    },
    {
        id: 5,
        words: ['El', 'niño', 'juega', 'con', 'su', 'perro'],
        correctSentence: 'El niño juega con su perro',
        translation: 'The boy plays with his dog',
        completed: false
    }
];

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({ onClose, onGameComplete }) => {
    const [gameItems, setGameItems] = useState<SentenceChallenge[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userSentence, setUserSentence] = useState<string[]>([]);
    const [remainingWords, setRemainingWords] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(90);
    const [gameComplete, setGameComplete] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    
    useEffect(() => {
        const shuffledChallenges = [...challenges]
            .sort(() => Math.random() - 0.5)
            .slice(0, 5) 
            .map(challenge => ({
                ...challenge,
                completed: false,
                
                words: [...challenge.words].sort(() => Math.random() - 0.5)
            }));
        
        setGameItems(shuffledChallenges);
        setRemainingWords(shuffledChallenges[0].words);
    }, []);

    
    useEffect(() => {
        if (timeLeft <= 0 || gameComplete) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1 && !gameComplete) {
                    clearInterval(timer);
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, gameComplete]);

    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    
    const handleWordSelect = (word: string) => {
        
        const newUserSentence = [...userSentence, word];
        setUserSentence(newUserSentence);
        
        
        const newRemainingWords = remainingWords.filter((w, i) => 
            i !== remainingWords.findIndex(rw => rw === word)
        );
        setRemainingWords(newRemainingWords);
        
        
        if (newRemainingWords.length === 0) {
            checkSentence(newUserSentence);
        }
    };

    
    const handleRemoveWord = (index: number) => {
        const word = userSentence[index];
        
        const newUserSentence = [...userSentence];
        newUserSentence.splice(index, 1);
        setUserSentence(newUserSentence);
        
        
        setRemainingWords([...remainingWords, word]);
    };

    
    const checkSentence = (sentence: string[]) => {
        const userSentenceStr = sentence.join(' ');
        const isCorrect = userSentenceStr === gameItems[currentIndex].correctSentence;
        
        
        const updatedItems = [...gameItems];
        updatedItems[currentIndex].completed = isCorrect;
        setGameItems(updatedItems);
        
        if (isCorrect) {
            const points = 200 + Math.round(timeLeft * 2);
            setScore(prev => prev + points);
            
            setShowSuccess(true);
            
            setTimeout(() => {
                setShowSuccess(false);
                if (currentIndex < gameItems.length - 1) {
                    nextSentence();
                } else {
                    endGame();
                }
            }, 1500);
        } else {
            
            setUserSentence([]);
            setRemainingWords([...gameItems[currentIndex].words].sort(() => Math.random() - 0.5));
        }
    };

    const resetSentence = () => {
        setUserSentence([]);
        setRemainingWords([...gameItems[currentIndex].words].sort(() => Math.random() - 0.5));
    };

    const nextSentence = () => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setUserSentence([]);
        setRemainingWords([...gameItems[nextIndex].words].sort(() => Math.random() - 0.5));
    };

    const skipSentence = () => {
        setScore(prev => Math.max(0, prev - 50));
        
        if (currentIndex < gameItems.length - 1) {
            nextSentence();
        } else {
            endGame();
        }
    };

    const endGame = () => {
        setGameComplete(true);
        const finalScore = score + (timeLeft > 0 ? timeLeft : 0);
        onGameComplete(finalScore);
    };

    return (
        <Stack>
            <Paper
                p="md"
                radius="md"
                bg="dark.7"
                style={{ border: '1px solid #2C2E33' }}
            >
                <Group p="apart" align="center">
                    <Group>
                        <Text size="xl" fw={700} c="white">Score: {score}</Text>
                        {gameComplete && (
                            <Badge size="lg" color="green" variant="light">
                                Game Complete!
                            </Badge>
                        )}
                    </Group>
                    <Group>
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
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="lg"
                            onClick={onClose}
                        >
                            <IconX size="1.2rem" />
                        </ActionIcon>
                    </Group>
                </Group>
            </Paper>

            {gameItems.length > 0 && (
                <Stack m="xl" py="md">
                    <Group p="center" m="xs">
                        {gameItems.map((item, idx) => (
                            <Badge
                                key={`progress-${idx}`}
                                variant={idx === currentIndex ? "filled" : "light"}
                                color={item.completed ? "green" : idx === currentIndex ? "blue" : "gray"}
                                size="lg"
                                style={{ width: '30px' }}
                            >
                                {idx + 1}
                            </Badge>
                        ))}
                    </Group>

                    <Paper
                        p="md"
                        radius="md"
                        bg="dark.6"
                        style={{
                            border: '1px solid #2C2E33',
                            textAlign: 'center'
                        }}
                    >
                        <Text size="lg" c="dimmed">Translation: <Text span fw={700} c="white">{gameItems[currentIndex].translation}</Text></Text>
                    </Paper>

                    {showSuccess && (
                        <Paper
                            p="lg"
                            radius="md"
                            bg="green.9"
                            style={{
                                border: '1px solid #22C55E',
                                textAlign: 'center',
                                position: 'relative'
                            }}
                        >
                            <Group p="center">
                                <IconCheck size="2rem" />
                                <Text size="xl" fw={700} c="white">Correct!</Text>
                            </Group>
                        </Paper>
                    )}

                    <Paper
                        p="xl"
                        radius="md"
                        bg="dark.8"
                        style={{
                            border: '1px solid #2C2E33',
                            minHeight: '100px',
                        }}
                    >
                        <Stack>
                            <Text size="sm" c="dimmed" mb="xs">Build the correct sentence:</Text>
                            <Flex wrap="wrap" gap="sm" align="center">
                                {userSentence.length > 0 ? userSentence.map((word, idx) => (
                                    <Card
                                        key={`sentence-${idx}`}
                                        p="xs"
                                        radius="md"
                                        bg="blue.9"
                                        style={{
                                            cursor: 'pointer',
                                            border: '1px solid #3B82F6',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onClick={() => handleRemoveWord(idx)}
                                    >
                                        <Text size="md" c="white">{word}</Text>
                                    </Card>
                                )) : (
                                    <Text c="dimmed">Click on words below to build your sentence</Text>
                                )}
                            </Flex>
                        </Stack>
                    </Paper>

                    <Paper
                        p="lg"
                        radius="md"
                        bg="dark.7"
                        style={{
                            border: '1px solid #2C2E33',
                        }}
                    >
                        <Stack>
                            <Text size="sm" c="dimmed" mb="xs">Available words:</Text>
                            <Flex wrap="wrap" gap="sm">
                                {remainingWords.length > 0 ? remainingWords.map((word, idx) => (
                                    <Card
                                        key={`word-${idx}`}
                                        p="xs"
                                        radius="md"
                                        bg="dark.6"
                                        style={{
                                            cursor: 'pointer',
                                            border: '1px solid #4B5563',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onClick={() => handleWordSelect(word)}
                                    >
                                        <Text size="md" c="white">{word}</Text>
                                    </Card>
                                )) : (
                                    <Text c="dimmed">All words used!</Text>
                                )}
                            </Flex>
                        </Stack>
                    </Paper>
                    <Group p="center">
                        <Button
                            variant="light"
                            color="blue"
                            onClick={resetSentence}
                            disabled={userSentence.length === 0 || gameItems[currentIndex].completed}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="light"
                            color="yellow"
                            onClick={skipSentence}
                            disabled={gameItems[currentIndex].completed || gameComplete}
                        >
                            Skip (-50 pts)
                        </Button>
                    </Group>
                </Stack>
            )}

            <Group mt="xl">
                <Button
                    color="red"
                    variant="light"
                    size="md"
                    onClick={onClose}
                >
                    Exit Game
                </Button>
            </Group>
        </Stack>
    );
};