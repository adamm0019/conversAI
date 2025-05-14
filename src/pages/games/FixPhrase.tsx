import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Button,
  Container,
  rem,
  Center,
  AppShell,
  Loader,
  TextInput,
  Progress,
  ActionIcon,
  Badge,
  Divider,
  RingProgress
} from '@mantine/core';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconX,
  IconRefresh,
  IconTrophy,
  IconMicrophone,
  IconVolumeOff,
  IconVolume
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { Header } from '../../components/Header/Header';
import { notifications } from '@mantine/notifications';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase/firebaseConfig';
import { useDisclosure } from '@mantine/hooks';

const pulseAnimation = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.05)' },
  '100%': { transform: 'scale(1)' }
});

const glowAnimation = keyframes({
  '0%': { boxShadow: '0 0 5px rgba(90, 120, 220, 0.3)' },
  '50%': { boxShadow: '0 0 20px rgba(90, 120, 220, 0.6)' },
  '100%': { boxShadow: '0 0 5px rgba(90, 120, 220, 0.3)' }
});

const accentBlue = '#4195d3';
const accentPurple = '#8366d1';
const accentGreen = '#43c59e';
const accentRed = '#d64161';
const darkBg = '#141417';
const cardBg = 'rgba(30, 31, 40, 0.7)';
const glassEffect = {
  background: cardBg,
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.3s ease',
  borderRadius: rem(16)
};


const getPracticeSentences = (language: string) => {
  const sentences: { [key: string]: { original: string; correct: string; hint: string }[] } = {
    spanish: [
      { 
        original: "Yo soy estudiante de español para dos años.", 
        correct: "Yo soy estudiante de español desde hace dos años.", 
        hint: "Use 'desde hace' for duration of time until now" 
      },
      { 
        original: "Mi hermana tiene 15 años y ella es muy alto.", 
        correct: "Mi hermana tiene 15 años y ella es muy alta.", 
        hint: "Adjective agreement with feminine nouns" 
      },
      { 
        original: "Ayer yo he ido al mercado.", 
        correct: "Ayer yo fui al mercado.", 
        hint: "Use preterite for completed actions in the past" 
      },
      { 
        original: "Me gusta los libros de ciencia ficción.", 
        correct: "Me gustan los libros de ciencia ficción.", 
        hint: "Verb agreement with plural noun" 
      },
      { 
        original: "Juan y María son inteligente y trabajador.", 
        correct: "Juan y María son inteligentes y trabajadores.", 
        hint: "Adjective agreement with plural subjects" 
      },
      { 
        original: "El niño que pelo negro es mi primo.", 
        correct: "El niño de pelo negro es mi primo.", 
        hint: "Use 'de' to indicate possession" 
      },
      { 
        original: "No conozco nadie aquí.", 
        correct: "No conozco a nadie aquí.", 
        hint: "Use personal 'a' before people" 
      }
    ],
    french: [
      { 
        original: "Je suis étudiant pour deux ans.", 
        correct: "Je suis étudiant depuis deux ans.", 
        hint: "Use 'depuis' for duration of time until now" 
      },
      { 
        original: "Ma soeur a 15 ans et elle est très grand.", 
        correct: "Ma soeur a 15 ans et elle est très grande.", 
        hint: "Adjective agreement with feminine nouns" 
      },
      { 
        original: "Hier, j'ai allé au marché.", 
        correct: "Hier, je suis allé au marché.", 
        hint: "Use 'être' as auxiliary verb with 'aller'" 
      }
    ],
    german: [
      { 
        original: "Ich bin Student für zwei Jahren.", 
        correct: "Ich bin seit zwei Jahren Student.", 
        hint: "Use 'seit' for duration of time until now" 
      },
      { 
        original: "Meine Schwester ist 15 Jahre alt und sie ist sehr groß.", 
        correct: "Meine Schwester ist 15 Jahre alt und sie ist sehr groß.", 
        hint: "This sentence is already correct" 
      },
      { 
        original: "Gestern ich bin zum Markt gegangen.", 
        correct: "Gestern bin ich zum Markt gegangen.", 
        hint: "Verb should be in second position" 
      }
    ]
  };

  return sentences[language] || sentences.spanish;
};

const FixPhrase = () => {
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [sentences, setSentences] = useState<{ original: string; correct: string; hint: string }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [muted, setMuted] = useState(false);
  const { userProfile, isLoading, updateUserProfile } = useUserProfile();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const resetGame = () => {
    setScore(0);
    setCurrentSentenceIndex(0);
    setUserInput('');
    setShowHint(false);
    setFeedback(null);
    setGameCompleted(false);
    setShowingAnswer(false);
    initializeGame();
  };

  const handleModeChange = (mode: string) => {
    if (mode === 'home') {
      navigate('/');
    } else if (mode === 'profile') {
      navigate('/profile');
    } else if (mode === 'games') {
      navigate('/games');
    }
  };

  const initializeGame = () => {
    setLoading(true);
    
    const preferredLanguage = userProfile?.settings?.preferredLanguage || 'spanish';
    const allSentences = getPracticeSentences(preferredLanguage);
    
    
    const shuffledSentences = [...allSentences].sort(() => 0.5 - Math.random()).slice(0, 5);
    setSentences(shuffledSentences);
    
    setCurrentSentenceIndex(0);
    setUserInput('');
    
    setTimeout(() => {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 500);
  };

  
  useEffect(() => {
    if (!isLoading && userProfile) {
      initializeGame();
    }
  }, [isLoading, userProfile]);

  const checkAnswer = () => {
    const currentSentence = sentences[currentSentenceIndex];
    const isCorrect = userInput.trim().toLowerCase() === currentSentence.correct.toLowerCase();
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    
    setTimeout(() => {
      if (isCorrect) {
        moveToNextSentence();
      }
      setFeedback(null);
    }, 1500);
  };

  const showAnswer = () => {
    setUserInput(sentences[currentSentenceIndex].correct);
    setShowingAnswer(true);
  };

  const moveToNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
      setUserInput('');
      setShowHint(false);
      setShowingAnswer(false);
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      
      const totalXp = score + 10; 
      setXpEarned(totalXp);
      setGameCompleted(true);
      saveProgress(totalXp);
    }
  };

  const saveProgress = async (xp: number) => {
    if (!userProfile) return;

    try {
      const userLanguage = userProfile.settings.preferredLanguage || 'spanish';
      const userProfileRef = doc(db, 'user_profiles', userProfile.userId);
      
      
      await updateDoc(userProfileRef, {
        [`languages.${userLanguage}.experiencePoints`]: increment(xp),
        [`languages.${userLanguage}.lessonsCompleted`]: increment(1)
      });

      updateUserProfile({
        languages: {
          ...userProfile.languages,
          [userLanguage]: {
            ...userProfile.languages[userLanguage],
            experiencePoints: (userProfile.languages[userLanguage]?.experiencePoints || 0) + xp,
            lessonsCompleted: (userProfile.languages[userLanguage]?.lessonsCompleted || 0) + 1
          }
        }
      });

      notifications.show({
        title: 'Progress Saved',
        message: `You earned ${xp} XP!`,
        color: 'green'
      });
    } catch (error) {

      notifications.show({
        title: 'Error',
        message: 'Failed to save progress',
        color: 'red'
      });
    }
  };

  if (loading || isLoading) {
    return (
      <Center style={{ height: '100vh', width: '100vw' }}>
        <Stack align="center">
          <Loader size="lg" />
          <Text>Loading fix the phrase game...</Text>
        </Stack>
      </Center>
    );
  }

  const currentSentence = sentences[currentSentenceIndex];
  const progressPercent = (currentSentenceIndex / sentences.length) * 100;

  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
      style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: darkBg,
      }}
    >
      <Header
        selectedMode="games"
        onModeChange={handleModeChange}
        onResetAPIKey={() => { }}
        showSettings={true}
      />

      <AppShell.Main style={{
        height: 'calc(100vh - 60px)',
        backgroundColor: darkBg,
        backgroundImage: 'radial-gradient(circle at top right, rgba(80, 100, 240, 0.08) 0%, transparent 80%)',
        overflowY: 'auto'
      }}>
        <Box
          py="xl"
          style={{
            paddingTop: rem(40),
            paddingBottom: rem(60),
          }}
        >
          <Container size="md">
            <Paper
              p="lg"
              radius="lg"
              mb="xl"
              style={{
                ...glassEffect,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Group justify="space-between" align="center">
                <Group>
                  <ActionIcon 
                    variant="light" 
                    radius="xl" 
                    color="blue" 
                    size="lg"
                    onClick={() => navigate('/games')}
                  >
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                  <Title order={2}>Fix the Phrase</Title>
                </Group>

                <Group>
                  <Badge size="lg" radius="sm" color="blue">
                    <Group gap="xs">
                      <IconTrophy size={16} />
                      <Text>{score} points</Text>
                    </Group>
                  </Badge>
                  
                  <ActionIcon
                    variant="light"
                    radius="xl"
                    color="gray"
                  >
                    {muted ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
                  </ActionIcon>
                  
                  <Button
                    variant="light"
                    color="gray"
                    radius="xl"
                    leftSection={<IconRefresh size={16} />}
                    onClick={resetGame}
                  >
                    Reset
                  </Button>
                </Group>
              </Group>
              
              <Progress 
                value={progressPercent} 
                size="sm" 
                color="blue" 
                radius="xl" 
                mt="md"
              />
            </Paper>

            {gameCompleted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Paper
                  p="xl"
                  radius="lg"
                  style={{
                    ...glassEffect,
                    textAlign: 'center',
                    animation: `${glowAnimation} 3s infinite ease-in-out`,
                  }}
                >
                  <Stack align="center" gap="lg">
                    <RingProgress
                      sections={[{ value: 100, color: accentGreen }]}
                      size={120}
                      thickness={12}
                      label={
                        <Center>
                          <IconCheck size={40} color={accentGreen} />
                        </Center>
                      }
                    />
                    
                    <Title order={2}>
                      Exercise Completed!
                    </Title>
                    
                    <Text size="xl">
                      You've successfully fixed all the phrases!
                    </Text>
                    
                    <Badge size="xl" radius="sm" color="green">
                      <Group gap="xs">
                        <IconTrophy size={18} />
                        <Text>Earned: {xpEarned} XP</Text>
                      </Group>
                    </Badge>
                    
                    <Group mt="md">
                      <Button
                        variant="light"
                        color="gray"
                        radius="xl"
                        leftSection={<IconRefresh size={16} />}
                        onClick={resetGame}
                      >
                        Play Again
                      </Button>
                      
                      <Button
                        variant="filled"
                        color="blue"
                        radius="xl"
                        onClick={() => navigate('/games')}
                      >
                        Back to Games
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              </motion.div>
            ) : (
              <Box>
                <Paper
                  p="xl"
                  radius="lg"
                  mb="md"
                  style={{
                    ...glassEffect,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Original Sentence:</Text>
                      <Text size="sm" c="dimmed">{currentSentenceIndex + 1} of {sentences.length}</Text>
                    </Group>
                    
                    <Text size="lg" fw={600} style={{ 
                      color: '#fff',
                      padding: '1rem',
                      borderRadius: rem(8),
                      backgroundColor: 'rgba(0, 0, 0, 0.2)'
                    }}>
                      {currentSentence.original}
                    </Text>
                    
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">Corrected Sentence:</Text>
                      <TextInput
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type the corrected sentence"
                        size="lg"
                        radius="md"
                        disabled={showingAnswer}
                        style={{ 
                          backgroundColor: feedback === 'correct' 
                            ? `${accentGreen}20` 
                            : feedback === 'incorrect' 
                              ? `${accentRed}20` 
                              : undefined
                        }}
                        rightSection={
                          feedback === 'correct' ? (
                            <IconCheck size={20} color={accentGreen} style={{ animation: `${pulseAnimation} 1s infinite` }} />
                          ) : feedback === 'incorrect' ? (
                            <IconX size={20} color={accentRed} style={{ animation: `${pulseAnimation} 1s infinite` }} />
                          ) : null
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && userInput.trim() !== '') {
                            checkAnswer();
                          }
                        }}
                      />
                    </Stack>
                    
                    {showHint && (
                      <Paper p="md" radius="md" bg="rgba(0, 0, 0, 0.2)">
                        <Group>
                          <Text fw={600} c="yellow">Hint:</Text>
                          <Text>{currentSentence.hint}</Text>
                        </Group>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
                
                <Group justify="space-between">
                  <Button
                    variant="subtle"
                    color="yellow"
                    onClick={() => setShowHint(true)}
                    disabled={showHint}
                  >
                    Show Hint
                  </Button>
                  
                  <Group>
                    <Button
                      variant="light"
                      color="gray"
                      onClick={showAnswer}
                      disabled={showingAnswer}
                    >
                      Show Answer
                    </Button>
                    
                    {showingAnswer ? (
                      <Button
                        variant="filled"
                        color="blue"
                        rightSection={<IconArrowRight size={16} />}
                        onClick={moveToNextSentence}
                      >
                        Next Sentence
                      </Button>
                    ) : (
                      <Button
                        variant="filled"
                        color="blue"
                        onClick={checkAnswer}
                        disabled={userInput.trim() === ''}
                      >
                        Check Answer
                      </Button>
                    )}
                  </Group>
                </Group>
              </Box>
            )}
          </Container>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export default FixPhrase; 