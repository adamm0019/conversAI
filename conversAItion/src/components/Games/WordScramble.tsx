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
    Card
} from '@mantine/core';
import { IconX, IconDoorExit, IconClock, IconRefresh, IconCheck } from '@tabler/icons-react';

interface WordScrambleProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

interface ScrambleWord {
    original: string;
    scrambled: string;
    translation: string;
    solved: boolean;
}

const vocabulary = [
    { word: 'casa', translation: 'house' },
    { word: 'perro', translation: 'dog' },
    { word: 'gato', translation: 'cat' },
    { word: 'libro', translation: 'book' },
    { word: 'mesa', translation: 'table' },
    { word: 'tiempo', translation: 'time' },
    { word: 'ciudad', translation: 'city' },
    { word: 'familia', translation: 'family' },
    { word: 'comida', translation: 'food' },
    { word: 'agua', translation: 'water' },
];

const scrambleWord = (word: string): string => {
    const letters = word.split('');
    let scrambled = word;
    
    while (scrambled === word) {
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        scrambled = letters.join('');
    }
    
    return scrambled;
};

export const WordScramble: React.FC<WordScrambleProps> = ({ onClose, onGameComplete }) => {
    const [words, setWords] = useState<ScrambleWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameComplete, setGameComplete] = useState(false);

    useEffect(() => {
        const shuffled = [...vocabulary]
            .sort(() => Math.random() - 0.5)
            .slice(0, 5)
            .map(item => ({
                original: item.word,
                scrambled: scrambleWord(item.word),
                translation: item.translation,
                solved: false
            }));
        
        setWords(shuffled);
    }, []);

    // Timer countdown
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

    const handleLetterClick = (letter: string, index: number) => {
        if (words[currentIndex].solved) return;
        
        const newUserInput = [...userInput, letter];
        setUserInput(newUserInput);
        
        // Check if the word is complete
        if (newUserInput.join('') === words[currentIndex].original) {
            // Word is solved!
            const newWords = [...words];
            newWords[currentIndex].solved = true;
            setWords(newWords);
            setScore(prev => prev + 100);
            
            setTimeout(() => {
                setUserInput([]);
                if (currentIndex < words.length - 1) {
                    setCurrentIndex(prevIndex => prevIndex + 1);
                } else {
                    endGame();
                }
            }, 1000);
        }
    };

    const resetAttempt = () => {
        setUserInput([]);
    };

    const endGame = () => {
        setGameComplete(true);
        const finalScore = score + (timeLeft > 0 ? timeLeft * 2 : 0);
        onGameComplete(finalScore);
    };

    const getRemainingLetters = () => {
        if (!words[currentIndex]) return [];
        
        const scrambledLetters = words[currentIndex].scrambled.split('');
        const usedCount = userInput.reduce((acc, letter) => {
            acc[letter] = (acc[letter] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return scrambledLetters.filter(letter => {
            if (!usedCount[letter]) return true;
            usedCount[letter]--;
            return false;
        });
    };

    const skipWord = () => {
        setScore(prev => Math.max(0, prev - 25));
        setUserInput([]);
        
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prevIndex => prevIndex + 1);
        } else {
            endGame();
        }
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
                            <IconClock size="1.2rem" style={{ color: timeLeft <= 15 ? '#EF4444' : '#A1A1AA' }} />
                            <Text
                                size="xl"
                                fw={700}
                                c={timeLeft <= 15 ? 'red' : 'dimmed'}
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

            {words.length > 0 && (
                <Stack m="xl" align="center" py="md">
                    <Paper
                        p="md"
                        radius="md"
                        bg="dark.6"
                        style={{
                            border: '1px solid #2C2E33',
                            width: '100%',
                            textAlign: 'center'
                        }}
                    >
                        <Text size="lg" c="dimmed">Translation: <Text span fw={700} c="white">{words[currentIndex].translation}</Text></Text>
                    </Paper>

                    <Paper
                        p="xl"
                        radius="md"
                        bg="dark.8"
                        style={{
                            border: '1px solid #2C2E33',
                            minHeight: '100px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Flex gap="md" justify="center" wrap="wrap">
                            {userInput.length === 0 ? (
                                <Text c="dimmed" size="lg">Click the letters below to unscramble the word</Text>
                            ) : (
                                userInput.map((letter, idx) => (
                                    <Card
                                        key={`input-${idx}`}
                                        p="xs"
                                        radius="md"
                                        bg={words[currentIndex].solved ? "green.9" : "blue.9"}
                                        style={{
                                            width: '50px',
                                            height: '60px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Text size="xl" fw={700} c="white">{letter}</Text>
                                    </Card>
                                ))
                            )}
                        </Flex>
                    </Paper>

                    <Flex gap="sm" justify="center" wrap="wrap">
                        {words[currentIndex].solved ? (
                            <Group>
                                <IconCheck size="2rem" color="#22C55E" />
                                <Text size="lg" fw={700} c="green">Well done!</Text>
                            </Group>
                        ) : (
                            getRemainingLetters().map((letter, idx) => (
                                <Card
                                    key={`letter-${idx}`}
                                    p="xs"
                                    radius="md"
                                    bg="dark.7"
                                    style={{
                                        width: '50px',
                                        height: '60px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #3B82F6',
                                        transition: 'all 0.15s ease',
                                        transform: 'scale(1)',
                                        ':hover': {
                                            transform: 'scale(1.05)',
                                        }
                                    }}
                                    onClick={() => handleLetterClick(letter, idx)}
                                >
                                    <Text size="xl" fw={700} c="white">{letter}</Text>
                                </Card>
                            ))
                        )}
                    </Flex>

                    <Group mt="md">
                        <Button
                            variant="light"
                            color="blue"
                            onClick={resetAttempt}
                            disabled={userInput.length === 0 || words[currentIndex].solved}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="light"
                            color="yellow"
                            onClick={skipWord}
                            disabled={words[currentIndex].solved || gameComplete}
                        >
                            Skip (-25 pts)
                        </Button>
                    </Group>

                    <Group p="center" m="xs">
                        {words.map((_, idx) => (
                            <Badge
                                key={`progress-${idx}`}
                                variant={idx === currentIndex ? "filled" : "light"}
                                color={words[idx].solved ? "green" : idx <= currentIndex ? "blue" : "gray"}
                                size="lg"
                                style={{ width: '30px' }}
                            >
                                {idx + 1}
                            </Badge>
                        ))}
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