import React, { useState, useEffect } from 'react';
import {
  Box,
  Title, 
  Paper, 
  Group, 
  Text,
  Stack,
  Container, 
  SimpleGrid,
  rem,
  Progress,
  ThemeIcon,
  ActionIcon,
  Button,
  Center,
  AppShell,
  Select,
  Divider,
  Badge,
  RingProgress
} from '@mantine/core';
import { getRandomReferencePhrase, languageLocaleMap } from '../../config/pronunciationConfig';
import PronunciationAssessment from '../PronunciationAssessment';
import { 
  IconMicrophone, 
  IconVocabulary, 
  IconRefresh, 
  IconMessages,
  IconArrowLeft,
  IconTrophy,
  IconLanguage,
  IconFlame,
  IconArrowRight,
  IconEar,
  IconSchool,
  IconChevronDown,
  IconBrandHipchat
} from '@tabler/icons-react';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { Header } from '../Header/Header';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { GlassUI } from '../GlassUI/GlassUI';

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

const darkBg = '#141417';
const cardBg = 'rgba(25, 27, 32, 0.7)';
const accentBlue = '#4195d3';
const accentPurple = '#8366d1';
const accentGreen = '#43c59e';
const accentOrange = '#e6854a';
const accentRed = '#d64161';

const glassEffect = {
  background: 'rgba(30, 31, 40, 0.7)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.3s ease',
  borderRadius: rem(16)
};

const cardStyles = {
  ...glassEffect,
  padding: rem(24),
  marginBottom: rem(20),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
};

interface PracticeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  xp: number;
  progress: number;
  onClick: () => void;
}

const PracticeCard: React.FC<PracticeCardProps> = ({
  title,
  description,
  icon,
  color,
  xp,
  progress,
  onClick
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Paper
      p="xl"
      radius="lg"
      onClick={onClick}
      style={{
        ...glassEffect,
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered ? `0 10px 20px rgba(0, 0, 0, 0.2)` : 'none',
        cursor: 'pointer',
        height: '100%',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
          opacity: hovered ? 0.8 : 0.4,
          transition: 'opacity 0.3s ease'
        }}
      />

      <Group mb={20} align="flex-start" wrap="nowrap">
        <ThemeIcon 
          size={50} 
          radius="xl" 
          variant="light" 
          color={color.replace('#', '')}
          style={{ 
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`
          }}
        >
          {icon}
        </ThemeIcon>
        <Box>
          <Text fw={600} size="lg" style={{ fontSize: '20px', lineHeight: 1.2, marginBottom: '4px' }}>
            {title}
          </Text>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.3 }}>
            {description}
          </Text>
        </Box>
      </Group>

      <Progress
        value={progress}
        color={color.replace('#', '')}
        size="md"
        radius="xl"
        style={{ marginBottom: rem(20) }}
      />

      <Group justify="space-between" mt="auto">
        <Group gap="xs" align="center">
          <IconTrophy size={16} color={color} />
          <Text fw={600} size="md">{xp} XP</Text>
        </Group>

        <ThemeIcon 
          size="sm" 
          radius="xl" 
          variant="light" 
          color={color.replace('#', '')}
          style={{ 
            width: '30px', 
            height: '30px', 
            backgroundColor: `${color}15`,
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s ease'
          }}
        >
          <IconArrowRight size={16} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
};

export const PronunciationPractice: React.FC = () => {
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();

  const defaultLanguage = userProfile?.settings?.preferredLanguage || 'english';
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [referenceText, setReferenceText] = useState('');
  const [isPracticing, setIsPracticing] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  
  useEffect(() => {
    if (userProfile && userProfile.streak) {
      setStreakDays(userProfile.streak.currentStreak || 0);
    }
  }, [userProfile]);

  const handleModeChange = (mode: string) => {
    if (mode === 'home') {
      navigate('/');
    } else if (mode === 'profile') {
      navigate('/profile');
    } else if (mode === 'games') {
      navigate('/games');
    }
  };

  const startPractice = () => {
    const phrase = getRandomReferencePhrase(selectedLanguage);
    setReferenceText(phrase);
    setIsPracticing(true);
  };

  const getNewPhrase = () => {
    const phrase = getRandomReferencePhrase(selectedLanguage);
    setReferenceText(phrase);
  };

  const handleAssessmentComplete = (result: any) => {
    console.log('Assessment result:', result);
  };

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'italian', label: 'Italian' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'chinese', label: 'Chinese' },
  ];

  const handleLanguageChange = (value: string | null) => {
    if (value) {
      setSelectedLanguage(value);
    }
  };

  const practiceExercises = [
    {
      title: 'Basic Pronunciation',
      description: 'Practice common words and phrases',
      icon: <IconMicrophone size={24} />,
      color: accentBlue,
      xp: 60,
      progress: 35,
      onClick: startPractice
    },
    {
      title: 'Sentence Flow',
      description: 'Practice your sentence flow',
      icon: <IconVocabulary size={24} />,
      color: accentPurple,
      xp: 45,
      progress: 25,
      onClick: startPractice
    },
    {
      title: 'Challenging Sounds',
      description: 'Practice difficult sounds',
      icon: <IconEar size={24} />,
      color: accentGreen,
      xp: 75,
      progress: 15,
      onClick: startPractice
    },
    {
      title: 'Accent Practice',
      description: 'Practice your accent/clarity',
      icon: <IconSchool size={24} />,
      color: accentOrange,
      xp: 55,
      progress: 40,
      onClick: startPractice
    }
  ];

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
        showSettings={true}
      />

      <AppShell.Main style={{
        height: 'calc(100vh - 60px)',
        backgroundColor: darkBg,
        backgroundImage: 'radial-gradient(circle at top right, rgba(80, 100, 240, 0.08) 0%, transparent 80%)',
        overflowY: 'auto'
      }}>
        <Container size="lg" py={rem(40)}>
          <Paper
            p="xl"
            radius="lg"
            mb={rem(30)}
            style={{
              ...glassEffect,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
            <Box
              style={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(131, 102, 209, 0.1) 0%, transparent 70%)',
                zIndex: 0
              }}
            />

            <Group justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
              <Box>
                <Group align="center" gap="md" mb={5}>
                  <Box>
                    <Title order={2} fw={700} style={{ fontSize: rem(28) }}>
                      Pronunciation Practice
                    </Title>
                  </Box>
                </Group>
              </Box>

              <Group>
                <Select
                  data={languageOptions}
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  radius="md"
                  size="sm"
                  leftSection={<IconLanguage size={16} />}
                  rightSection={<IconChevronDown size={14} />}
                  style={{
                    width: '150px',
                    background: 'rgba(37, 38, 43, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </Group>
            </Group>
          </Paper>

          {!isPracticing ? (
            <>
              <Paper
                p="xl"
                radius="lg"
                mb={rem(30)}
                style={{
                  ...glassEffect,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Group justify="apart" mb={rem(20)}>
                  <Box>
                    <Title order={3} mb={5}>Practice Exercises</Title>
                    <Text size="sm" c="dimmed">Select an exercise to start practicing</Text>
                  </Box>
                </Group>
                
                <Divider 
                  my={rem(20)} 
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.05)' 
                  }} 
                />
                
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing={rem(24)}>
                  {practiceExercises.map((exercise, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <PracticeCard
                        title={exercise.title}
                        description={exercise.description}
                        icon={exercise.icon}
                        color={exercise.color}
                        xp={exercise.xp}
                        progress={exercise.progress}
                        onClick={exercise.onClick}
                      />
                    </motion.div>
                  ))}
                </SimpleGrid>
              </Paper>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Paper
                p="xl"
                radius="lg"
                style={{
                  ...glassEffect,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Box>
                  <Group mb={rem(24)}>
                    <ThemeIcon 
                      size={48} 
                      radius="xl" 
                      variant="light" 
                      color="blue"
                      style={{ backgroundColor: 'rgba(65, 149, 211, 0.1)' }}
                    >
                      <IconMicrophone size={24} />
                    </ThemeIcon>
                    <Box>
                      <Title order={3}>Practice Session</Title>
                      <Text size="sm" c="dimmed">Speak clearly into your microphone</Text>
                    </Box>
                  </Group>
                  
                  <Divider 
                    my={rem(20)} 
                    style={{ 
                      borderColor: 'rgba(255, 255, 255, 0.05)' 
                    }} 
                  />
                  
                  <PronunciationAssessment
                    referenceText={referenceText}
                    onComplete={handleAssessmentComplete}
                    onError={(error) => console.error('Assessment error:', error)}
                    language={selectedLanguage}
                  />

                  <Group justify="center" mt={rem(30)}>
                    <Button 
                      leftSection={<IconArrowLeft size={16} />}
                      variant="default"
                      radius="xl"
                      onClick={() => setIsPracticing(false)}
                      size="md"
                      style={{
                        backgroundColor: 'rgba(37, 38, 43, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        height: '46px',
                        padding: '0 24px'
                      }}
                    >
                      Back to Exercises
                    </Button>
                    <Button
                      leftSection={<IconRefresh size={16} />}
                      variant="default"
                      radius="xl"
                      onClick={getNewPhrase}
                      size="md"
                      style={{
                        backgroundColor: 'rgba(37, 38, 43, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        height: '46px',
                        padding: '0 24px'
                      }}
                    >
                      New Phrase
                    </Button>
                  </Group>
                </Box>
              </Paper>
            </motion.div>
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default PronunciationPractice;
