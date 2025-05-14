import React, { useState, useEffect } from 'react';
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
  Grid,
  Divider,
  Badge,
  ActionIcon,
  RingProgress
} from '@mantine/core';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconRefresh,
  IconTrophy,
  IconHeart,
  IconHeartFilled
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { Header } from '../../components/Header/Header';
import { notifications } from '@mantine/notifications';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase/firebaseConfig';

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


const getWordPairs = (language: string) => {
  const wordPairs: { [key: string]: { [key: string]: string } } = {
    spanish: {
      'casa': 'house',
      'perro': 'dog',
      'libro': 'book',
      'tiempo': 'time',
      'agua': 'water',
      'comida': 'food',
      'amigo': 'friend',
      'trabajo': 'work',
      'ciudad': 'city',
      'familia': 'family'
    },
    french: {
      'maison': 'house',
      'chien': 'dog',
      'livre': 'book',
      'temps': 'time',
      'eau': 'water',
      'nourriture': 'food',
      'ami': 'friend',
      'travail': 'work',
      'ville': 'city',
      'famille': 'family'
    },
    german: {
      'haus': 'house',
      'hund': 'dog',
      'buch': 'book',
      'zeit': 'time',
      'wasser': 'water',
      'essen': 'food',
      'freund': 'friend',
      'arbeit': 'work',
      'stadt': 'city',
      'familie': 'family'
    }
  };

  return wordPairs[language] || wordPairs.spanish;
};

interface CardData {
  id: string;
  text: string;
  matched: boolean;
  flipped: boolean;
  type: 'word' | 'meaning';
  pairId: string;
}

const WordMatch = () => {
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const { userProfile, isLoading, updateUserProfile } = useUserProfile();
  const navigate = useNavigate();

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setFlippedCards([]);
    setMatchedPairs([]);
    setGameOver(false);
    setGameWon(false);
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
    const wordPairs = getWordPairs(preferredLanguage);
    
    
    const entries = Object.entries(wordPairs);
    const randomPairs = entries.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    const gameCards: CardData[] = [];
    
    randomPairs.forEach(([word, meaning], index) => {
      const pairId = `pair-${index}`;
      
      gameCards.push({
        id: `word-${index}`,
        text: word,
        matched: false,
        flipped: false,
        type: 'word',
        pairId
      });
      
      gameCards.push({
        id: `meaning-${index}`,
        text: meaning,
        matched: false,
        flipped: false,
        type: 'meaning',
        pairId
      });
    });

    
    const wordCards = gameCards.filter(card => card.type === 'word');
    const meaningCards = gameCards.filter(card => card.type === 'meaning');
    
    const shuffledWords = wordCards.sort(() => Math.random() - 0.5);
    const shuffledMeanings = meaningCards.sort(() => Math.random() - 0.5);
    
    setCards([...shuffledWords, ...shuffledMeanings]);
    
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  
  useEffect(() => {
    if (!isLoading && userProfile) {
      initializeGame();
    }
  }, [isLoading, userProfile]);

  const handleCardClick = (id: string) => {
    if (flippedCards.length === 2 || gameOver || gameWon) return;
    if (flippedCards.includes(id)) return;
    if (cards.find(card => card.id === id)?.matched) return;

    
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, flipped: true } : card
    ));
    
    
    setFlippedCards(prev => [...prev, id]);

    
    if (flippedCards.length === 1) {
      const firstCardId = flippedCards[0];
      const firstCard = cards.find(card => card.id === firstCardId);
      const secondCard = cards.find(card => card.id === id);
      
      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstCardId || card.id === id 
              ? { ...card, matched: true }
              : card
          ));
          
          setMatchedPairs(prev => [...prev, firstCard.pairId]);
          setScore(prev => prev + 10);
          setFlippedCards([]);
          
          
          if (matchedPairs.length + 1 === 5) {
            const xp = score + 10 + (lives * 5);
            setXpEarned(xp);
            setGameWon(true);
            saveProgress(xp);
          }
        }, 500);
      } else {
        
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstCardId || card.id === id 
              ? { ...card, flipped: false }
              : card
          ));
          
          setFlippedCards([]);
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives === 0) {
              setGameOver(true);
              
              const xp = Math.max(5, Math.floor(score / 2));
              setXpEarned(xp);
              saveProgress(xp);
            }
            return newLives;
          });
        }, 1000);
      }
    }
  };

  const saveProgress = async (xp: number) => {
    if (!userProfile) return;

    try {
      const userLanguage = userProfile.settings.preferredLanguage || 'spanish';
      const userProfileRef = doc(db, 'user_profiles', userProfile.userId);
      
      
      await updateDoc(userProfileRef, {
        [`languages.${userLanguage}.experiencePoints`]: increment(xp),
        [`languages.${userLanguage}.wordsLearned`]: increment(matchedPairs.length),
        [`languages.${userLanguage}.lessonsCompleted`]: increment(1)
      });

      updateUserProfile({
        languages: {
          ...userProfile.languages,
          [userLanguage]: {
            ...userProfile.languages[userLanguage],
            experiencePoints: (userProfile.languages[userLanguage]?.experiencePoints || 0) + xp,
            wordsLearned: (userProfile.languages[userLanguage]?.wordsLearned || 0) + matchedPairs.length,
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
          <Text>Loading word match game...</Text>
        </Stack>
      </Center>
    );
  }

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
                  <Title order={2}>Word Match</Title>
                </Group>

                <Group>
                  <Group gap="xs">
                    {[...Array(lives)].map((_, i) => (
                      <IconHeartFilled 
                        key={i} 
                        size={24} 
                        color={accentRed} 
                        style={{ 
                          animation: `${pulseAnimation} 1.5s infinite ease-in-out`,
                          animationDelay: `${i * 0.2}s`
                        }} 
                      />
                    ))}
                    {[...Array(3 - lives)].map((_, i) => (
                      <IconHeart key={i} size={24} color="gray" />
                    ))}
                  </Group>
                  
                  <Divider orientation="vertical" />
                  
                  <Badge size="lg" radius="sm" color="blue">
                    <Group gap="xs">
                      <IconTrophy size={16} />
                      <Text>{score} points</Text>
                    </Group>
                  </Badge>
                  
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
            </Paper>

            {(gameOver || gameWon) ? (
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
                    animation: gameWon ? `${glowAnimation} 3s infinite ease-in-out` : 'none',
                    borderColor: gameWon ? accentGreen : accentRed,
                  }}
                >
                  <Stack align="center" gap="lg">
                    {gameWon ? (
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
                    ) : (
                      <RingProgress
                        sections={[{ value: 100, color: accentRed }]}
                        size={120}
                        thickness={12}
                        label={
                          <Center>
                            <IconX size={40} color={accentRed} />
                          </Center>
                        }
                      />
                    )}
                    
                    <Title order={2}>
                      {gameWon ? 'Great Job!' : 'Game Over'}
                    </Title>
                    
                    <Text size="xl">
                      {gameWon 
                        ? `You've matched all the words!` 
                        : `You've run out of lives.`}
                    </Text>
                    
                    <Group>
                      <Badge size="xl" radius="sm" color={gameWon ? 'green' : 'blue'}>
                        <Group gap="xs">
                          <IconTrophy size={18} />
                          <Text>Earned: {xpEarned} XP</Text>
                        </Group>
                      </Badge>
                      
                      <Badge size="xl" radius="sm" color="blue">
                        <Group gap="xs">
                          <IconCheck size={18} />
                          <Text>Matched: {matchedPairs.length} pairs</Text>
                        </Group>
                      </Badge>
                    </Group>
                    
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
                <Text fw={500} size="lg" mb="md" c="dimmed">Match words from your target language on the left with their English translations on the right</Text>
                <Group align="flex-start" style={{ minHeight: '400px' }}>
                  <Box style={{ flex: 1 }}>
                    <Paper p="xs" radius="md" mb="md" bg="rgba(65, 149, 211, 0.1)" style={{ border: '1px solid rgba(65, 149, 211, 0.2)' }}>
                      <Text fw={600} ta="center">{userProfile?.settings?.preferredLanguage?.toUpperCase() || 'TARGET LANGUAGE'}</Text>
                    </Paper>
                    <Stack>
                      {cards
                        .filter(card => card.type === 'word')
                        .map((card) => (
                          <motion.div
                            key={card.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Paper
                              p="md"
                              radius="md"
                              onClick={() => handleCardClick(card.id)}
                              style={{
                                ...glassEffect,
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '60px',
                                backgroundColor: card.matched 
                                  ? `${accentGreen}30` 
                                  : card.flipped 
                                    ? `${accentBlue}30` 
                                    : cardBg,
                                borderColor: card.matched ? accentGreen : card.flipped ? accentBlue : 'rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <Text fw={600} size="lg" ta="center">{card.text}</Text>
                            </Paper>
                          </motion.div>
                        ))}
                    </Stack>
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Paper p="xs" radius="md" mb="md" bg="rgba(131, 102, 209, 0.1)" style={{ border: '1px solid rgba(131, 102, 209, 0.2)' }}>
                      <Text fw={600} ta="center">ENGLISH</Text>
                    </Paper>
                    <Stack>
                      {cards
                        .filter(card => card.type === 'meaning')
                        .map((card) => (
                          <motion.div
                            key={card.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Paper
                              p="md"
                              radius="md"
                              onClick={() => handleCardClick(card.id)}
                              style={{
                                ...glassEffect,
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '60px',
                                backgroundColor: card.matched 
                                  ? `${accentGreen}30` 
                                  : card.flipped 
                                    ? `${accentBlue}30` 
                                    : cardBg,
                                borderColor: card.matched ? accentGreen : card.flipped ? accentBlue : 'rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <Text fw={600} size="lg" ta="center">{card.text}</Text>
                            </Paper>
                          </motion.div>
                        ))}
                    </Stack>
                  </Box>
                </Group>
              </Box>
            )}
          </Container>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export default WordMatch; 