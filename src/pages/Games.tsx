import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import {
  Box,
  Title,
  Text,
  Stack,
  Grid,
  Paper,
  Group,
  Badge,
  Progress,
  Container,
  rem,
  Flex,
  Center,
  AppShell,
  Button,
  Loader,
  RingProgress
} from '@mantine/core';
import {
  IconRefresh,
  IconTrophy,
  IconFlame,
  IconLanguage,
  IconGraph,
  IconHeartFilled,
  IconSchool,
  IconVocabulary,
  IconMessages,
  IconMicrophone,
  IconPuzzle,
  IconPencil,
  IconAbc,
  IconReceipt,
  IconEar,
  IconArrowRight
} from '@tabler/icons-react';
import { Header } from '../components/Header/Header';
import { motion } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseChatService } from '../services/FirebaseChatService';

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
const accentOrange = '#e6854a';
const accentRed = '#d64161';
const accentYellow = '#f5bd1f';
const darkBg = '#141417';
const cardBg = 'rgba(30, 31, 40, 0.7)';
const glassEffect = {
  background: cardBg,
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.3s ease',
  borderRadius: rem(16)
};

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  xp: number;
  color: string;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  icon,
  progress,
  xp,
  color,
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
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered ? `0 10px 20px rgba(0, 0, 0, 0.2)` : 'none',
        cursor: 'pointer',
        height: '100%',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        padding: rem(24)
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
        <Center
          style={{
            width: rem(50),
            height: rem(50),
            borderRadius: '50%',
            backgroundColor: `${color}20`,
            color: color,
            flexShrink: 0
          }}
        >
          {icon}
        </Center>
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

        <Box
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            transform: hovered ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          <IconArrowRight size={16} color={color} />
        </Box>
      </Group>
    </Paper>
  );
};

const SkillProgressCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({
  title,
  value,
  icon,
  color
}) => (
  <Paper
    p="md"
    radius="md"
    style={{
      ...glassEffect,
      height: '100%'
    }}
  >
    <Stack align="center" gap="xs">
      <RingProgress
        sections={[{ value, color }]}
        thickness={5}
        roundCaps
        size={90}
        label={
          <Center>
            <Box style={{ color }}>{icon}</Box>
          </Center>
        }
      />
      <Text fw={600} size="md" mt="xs">
        {title}
      </Text>
      <Text size="sm" c="dimmed">
        {value}% Mastery
      </Text>
    </Stack>
  </Paper>
);

const BadgeCard: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string }> = ({
  title,
  description,
  icon,
  color
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        ...glassEffect,
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 6px 12px rgba(0, 0, 0, 0.2)` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Stack align="center" gap="xs">
        <Center
          style={{
            width: rem(50),
            height: rem(50),
            borderRadius: '50%',
            backgroundColor: `${color}20`,
            color
          }}
        >
          {icon}
        </Center>
        <Text fw={600} size="sm" mt="xs">
          {title}
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          {description}
        </Text>
      </Stack>
    </Paper>
  );
};

const ThemeIcon = ({ size = 'md', radius = 'md', color = 'blue', variant = 'filled', children }: any) => (
  <Center
    style={{
      width: size === 'lg' ? rem(42) : rem(32),
      height: size === 'lg' ? rem(42) : rem(32),
      borderRadius: radius === 'md' ? rem(8) : rem(16),
      backgroundColor: variant === 'filled' ? color : 'transparent',
      border: variant === 'light' ? `1px solid ${color}` : 'none',
      color: variant === 'light' ? color : 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    {children}
  </Center>
);

export const Games = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { userProfile, isLoading } = useUserProfile();
  const navigate = useNavigate();

  const handleModeChange = (mode: string) => {
    if (mode === 'home') {
      navigate('/');
    } else if (mode === 'profile') {
      navigate('/profile');
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  const getGameData = () => {
    if (!userProfile || Object.keys(userProfile.languages).length === 0) {
      return [];
    }

    const preferredLanguage = userProfile.settings.preferredLanguage;
    const languageData = userProfile.languages[preferredLanguage] || Object.values(userProfile.languages)[0];
    
    if (!languageData) {
      return [];
    }

    const totalXP = languageData.experiencePoints || 0;
    const baseProgress = Math.min(100, Math.round((totalXP / 1000) * 100));
    
    const games = [
      {
        title: "Speak Up",
        description: "Practice pronunciation and fluency",
        icon: <IconMicrophone size={24} />,
        progress: baseProgress + 5,
        xp: Math.floor(totalXP * 0.2),
        color: accentBlue,
        onClick: () => navigate('/games/speak-up')
      },
      {
        title: "Word Match",
        description: "Match words to their meanings",
        icon: <IconPuzzle size={24} />,
        progress: baseProgress - 10,
        xp: Math.floor(totalXP * 0.15),
        color: accentPurple,
        onClick: () => navigate('/games/word-match')
      },
      {
        title: "Fix the Phrase",
        description: "Correct sentences and improve grammar",
        icon: <IconPencil size={24} />,
        progress: baseProgress - 5,
        xp: Math.floor(totalXP * 0.17),
        color: accentGreen,
        onClick: () => navigate('/games/fix-phrase')
      },
      {
        title: "Grammar Check",
        description: "Test your grammar knowledge",
        icon: <IconAbc size={24} />,
        progress: baseProgress - 15,
        xp: Math.floor(totalXP * 0.14),
        color: accentOrange,
        onClick: () => navigate('/games/grammar-check')
      },
      {
        title: "Quick Recap",
        description: "Review what you've learned",
        icon: <IconReceipt size={24} />,
        progress: baseProgress + 10,
        xp: Math.floor(totalXP * 0.18),
        color: accentRed,
        onClick: () => navigate('/games/quick-recap')
      },
      {
        title: "Sound Catch",
        description: "Train your listening skills",
        icon: <IconEar size={24} />,
        progress: baseProgress,
        xp: Math.floor(totalXP * 0.16),
        color: accentYellow,
        onClick: () => navigate('/games/sound-catch')
      }
    ];

    return games;
  };

  const getSkillsData = () => {
    if (!userProfile || Object.keys(userProfile.languages).length === 0) {
      return {
        speaking: 0,
        grammar: 0,
        listening: 0,
        vocabulary: 0
      };
    }

    const preferredLanguage = userProfile.settings.preferredLanguage;
    const languageData = userProfile.languages[preferredLanguage] || Object.values(userProfile.languages)[0];
    
    if (!languageData) {
      return {
        speaking: 0,
        grammar: 0,
        listening: 0,
        vocabulary: 0
      };
    }

    const totalXP = languageData.experiencePoints || 0;
    const baseProgress = Math.min(100, Math.round((totalXP / 1000) * 100));
    
    return {
      speaking: Math.min(100, baseProgress + Math.floor(Math.random() * 10)),
      grammar: Math.min(100, baseProgress - Math.floor(Math.random() * 15)),
      listening: Math.min(100, baseProgress + Math.floor(Math.random() * 5)),
      vocabulary: Math.min(100, baseProgress + Math.floor(Math.random() * 15))
    };
  };

  const getBadgesData = () => {
    if (!userProfile || Object.keys(userProfile.languages).length === 0) {
      return [];
    }

    const preferredLanguage = userProfile.settings.preferredLanguage;
    const languageData = userProfile.languages[preferredLanguage] || Object.values(userProfile.languages)[0];
    
    if (!languageData) {
      return [];
    }

    const totalXP = languageData.experiencePoints || 0;
    const wordsLearned = languageData.wordsLearned || 0;
    const lessonsCompleted = languageData.lessonsCompleted || 0;
    
    const badges = [];
    
    if (totalXP >= 100) {
      badges.push({
        title: "First Steps",
        description: "Started your language journey",
        icon: <IconHeartFilled size={24} />,
        color: accentBlue
      });
    }
    
    if (wordsLearned >= 50) {
      badges.push({
        title: "Vocabulary Builder",
        description: `Learned ${wordsLearned} words`,
        icon: <IconVocabulary size={24} />,
        color: accentPurple
      });
    }
    
    if (lessonsCompleted >= 5) {
      badges.push({
        title: "Dedicated Learner",
        description: `Completed ${lessonsCompleted} lessons`,
        icon: <IconSchool size={24} />,
        color: accentGreen
      });
    }
    
    if (userProfile.streak?.currentStreak >= 3) {
      badges.push({
        title: "Consistent",
        description: `${userProfile.streak.currentStreak} day streak`,
        icon: <IconFlame size={24} />,
        color: accentRed
      });
    }
    
    return badges;
  };

  const streakDays = userProfile?.streak?.currentStreak || 0;
  const games = getGameData();
  const skills = getSkillsData();
  const badges = getBadgesData();

  if (loading || isLoading) {
    return (
      <Center style={{ height: '100vh', width: '100vw' }}>
        <Stack align="center">
          <Loader size="lg" />
          <Text>Loading games...</Text>
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
          <Container size="lg">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper
                p="xl"
                radius="xl"
                style={{
                  ...glassEffect,
                  marginBottom: rem(40),
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `${glowAnimation} 4s infinite ease-in-out`
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
                    background: `radial-gradient(circle, ${accentPurple}20 0%, transparent 70%)`,
                    zIndex: 0
                  }}
                />

                <Group justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
                  <Box>
                    <Group align="center" mb="xs">
                      <Title order={2} style={{ fontSize: '28px', fontWeight: 700 }}>
                        Games
                      </Title>
                    </Group>
                    <Text c="dimmed" size="md">
                      Keep learning with these games designed to improve your language skills
                    </Text>
                  </Box>

                  <Group>
                    <Button
                      variant="light"
                      radius="md"
                      leftSection={<IconRefresh size={16} />}
                      onClick={handleRefresh}
                    >
                      Refresh
                    </Button>

                    <Paper
                      p="md"
                      radius="md"
                      style={{
                        background: 'rgba(20, 20, 30, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <Group gap={8}>
                        <IconFlame
                          size={24}
                          color="#ff7b5c"
                          style={{ animation: `${pulseAnimation} 1.5s infinite ease-in-out` }}
                        />
                        <Stack gap={0}>
                          <Text size="xs" c="dimmed">Current Streak</Text>
                          <Text fw={700} size="xl" style={{ color: 'white' }}>
                            {streakDays} {streakDays === 1 ? 'day' : 'days'}
                          </Text>
                        </Stack>
                      </Group>
                    </Paper>
                  </Group>
                </Group>
              </Paper>
            </motion.div>

            <Grid gutter="lg" mb={50}>
              {games.map((game, index) => (
                <Grid.Col key={game.title} span={{ base: 12, sm: 6, md: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <GameCard
                      title={game.title}
                      description={game.description}
                      icon={game.icon}
                      progress={game.progress}
                      xp={game.xp}
                      color={game.color}
                      onClick={game.onClick}
                    />
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>

            <Box mb="lg">
              <Group align="center" mb="xs">
                <IconGraph size={20} color={accentBlue} />
                <Title
                  order={2}
                  style={{
                    fontSize: '22px',
                    fontWeight: 600
                  }}
                >
                  Your Skill Progress
                </Title>
              </Group>
              <Text size="sm" c="dimmed" mb="lg" style={{ maxWidth: '600px' }}>
                Track your skill development across different language areas
              </Text>
            </Box>

            <Grid mb={50}>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <SkillProgressCard
                    title="Speaking"
                    value={skills.speaking}
                    icon={<IconMicrophone size={24} />}
                    color={accentBlue}
                  />
                </motion.div>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <SkillProgressCard
                    title="Grammar"
                    value={skills.grammar}
                    icon={<IconAbc size={24} />}
                    color={accentPurple}
                  />
                </motion.div>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <SkillProgressCard
                    title="Listening"
                    value={skills.listening}
                    icon={<IconEar size={24} />}
                    color={accentGreen}
                  />
                </motion.div>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <SkillProgressCard
                    title="Vocabulary"
                    value={skills.vocabulary}
                    icon={<IconVocabulary size={24} />}
                    color={accentOrange}
                  />
                </motion.div>
              </Grid.Col>
            </Grid>

            {badges.length > 0 && (
              <>
                <Box mb="lg">
                  <Group align="center" mb="xs">
                    <IconTrophy size={20} color={accentGreen} />
                    <Title
                      order={2}
                      style={{
                        fontSize: '22px',
                        fontWeight: 600
                      }}
                    >
                      Your Badges
                    </Title>
                  </Group>
                  <Text size="sm" c="dimmed" mb="lg" style={{ maxWidth: '600px' }}>
                    Achievements you've earned on your language journey
                  </Text>
                </Box>

                <Grid mb={30}>
                  {badges.map((badge, index) => (
                    <Grid.Col key={badge.title} span={{ base: 6, xs: 4, sm: 3, lg: 2 }}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                      >
                        <BadgeCard
                          title={badge.title}
                          description={badge.description}
                          icon={badge.icon}
                          color={badge.color}
                        />
                      </motion.div>
                    </Grid.Col>
                  ))}
                </Grid>
              </>
            )}
          </Container>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export default Games; 