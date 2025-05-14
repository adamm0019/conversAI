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
  Avatar,
  Tabs,
  RingProgress,
  Card,
  Container,
  rem,
  Flex,
  Center,
  AppShell,
  Button,
  Loader
} from '@mantine/core';
import {
  IconUser,
  IconStars,
  IconCertificate,
  IconFlag,
  IconBrain,
  IconClockHour4,
  IconTrophy,
  IconFlame,
  IconCalendar,
  IconLanguage,
  IconGraph,
  IconArrowRight,
  IconHeartFilled,
  IconPlus,
  IconSchool,
  IconNote,
  IconVocabulary,
  IconMessages
} from '@tabler/icons-react';
import { Header } from '../components/Header/Header';
import { motion } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { UserProficiency } from '../components/LanguageInspector/UserProficiency';
import { Streak } from '../components/Streak/Streak';
import { useNavigate } from 'react-router-dom';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';

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
const darkBg = '#141417';
const cardBg = 'rgba(30, 31, 40, 0.7)';
const glassEffect = {
  background: cardBg,
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.3s ease',
  borderRadius: rem(16)
};


const LANGUAGE_COLORS: Record<string, string> = {
  spanish: accentBlue,
  french: accentPurple,
  italian: accentGreen,
  german: '#e6854a',
  japanese: '#d64161',
  chinese: '#f5bd1f',
  russian: '#b55a30',
  portuguese: '#61b15a',
  arabic: '#c19277',
  korean: '#5e548e',
  default: accentBlue
};


const getLanguageColor = (language: string): string => {
  return LANGUAGE_COLORS[language.toLowerCase()] || LANGUAGE_COLORS.default;
};

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color?: string;
  chart?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon, color = accentBlue, chart = null }) => (
  <Paper
    p="lg"
    radius="md"
    style={{
      ...glassEffect,
      height: '100%',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 8px 16px rgba(0, 0, 0, 0.2)`
      }
    }}
  >
    <Group mb="sm">
      <ThemeIcon size="lg" radius="md" color={color} variant="light">
        {React.cloneElement(icon as React.ReactElement, { color: color })}
      </ThemeIcon>
      <Text size="sm" c="dimmed" fw={500} style={{ fontSize: '14px' }}>
        {title}
      </Text>
    </Group>
    <Group justify="space-between" align="flex-end">
      <Text size="xl" fw={700} style={{ fontSize: '28px', color: 'white' }}>
        {value}
      </Text>
      <Text size="sm" c="dimmed" style={{ fontSize: '13px' }}>
        {unit}
      </Text>
    </Group>
    {chart && <div style={{ marginTop: '12px' }}>{chart}</div>}
  </Paper>
);

interface LanguageProgressCardProps {
  data: {
    language: string;
    level: string;
    progress: number;
    totalHours: number;
    streak: number;
    xp: number;
    wordCount: number;
    lessonsCompleted: number;
  };
  onClick?: () => void;
  color?: string;
}

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

const LanguageProgressCard: React.FC<LanguageProgressCardProps> = ({ data, onClick, color = accentBlue }) => {
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
        cursor: onClick ? 'pointer' : 'default'
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

      <Group justify="space-between" mb="md">
        <Stack gap="xs">
          <Group gap="sm">
            <ThemeIcon color={color} size="lg">
              <IconLanguage size={20} />
            </ThemeIcon>
            <Text fw={600} size="lg" style={{ fontSize: '20px' }}>{data.language}</Text>
          </Group>
          <Badge
            variant="light"
            size="sm"
            radius="md"
            color={color.replace('#', '')}
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            {data.level}
          </Badge>
        </Stack>

        <RingProgress
          size={90}
          thickness={5}
          roundCaps
          sections={[{ value: data.progress, color: color }]}
          label={
            <Center>
              <Text fw={700} size="lg" ta="center" style={{ fontSize: '18px' }}>
                {data.progress}%
              </Text>
            </Center>
          }
        />
      </Group>

      <Group mt="md" mb="md" justify="space-between">
        <div>
          <Text size="xs" c="dimmed" mb={5}>Total XP</Text>
          <Group gap="xs" align="center">
            <IconTrophy size={16} color={color} />
            <Text fw={600} size="md">{data.xp}</Text>
          </Group>
        </div>

        <div>
          <Text size="xs" c="dimmed" mb={5}>Words</Text>
          <Group gap="xs" align="center">
            <IconVocabulary size={16} color={color} />
            <Text fw={600} size="md">{data.wordCount}</Text>
          </Group>
        </div>

        <div>
          <Text size="xs" c="dimmed" mb={5}>Lessons</Text>
          <Group gap="xs" align="center">
            <IconSchool size={16} color={color} />
            <Text fw={600} size="md">{data.lessonsCompleted}</Text>
          </Group>
        </div>
      </Group>

      <Group mt="xl" justify="space-between">
        <Stack gap={3}>
          <Text size="sm" c="dimmed" style={{ fontSize: '13px' }}>Study Time</Text>
          <Group gap="xs" align="center">
            <IconClockHour4 size={16} color={color} />
            <Text fw={600} size="md">{data.totalHours}h</Text>
          </Group>
        </Stack>

        <Stack gap={3}>
          <Text size="sm" c="dimmed" style={{ fontSize: '13px' }}>Streak</Text>
          <Group gap="xs" align="center">
            <IconFlame size={16} color="#ff7b5c" style={{ animation: `${pulseAnimation} 1.5s infinite ease-in-out` }} />
            <Text fw={600} size="md">{data.streak} days</Text>
          </Group>
        </Stack>

        <Box
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
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

const StartLanguageCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
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
        backgroundColor: 'rgba(40, 40, 50, 0.7)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '320px'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Center
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: `${accentPurple}20`,
          marginBottom: '16px'
        }}
      >
        <IconPlus size={32} color={accentPurple} />
      </Center>
      <Text fw={600} size="lg" style={{ fontSize: '20px', marginBottom: '8px' }}>
        Start a new language
      </Text>
      <Text c="dimmed" size="sm" ta="center" style={{ maxWidth: '240px' }}>
        Add another language to your learning journey
      </Text>
    </Paper>
  );
};


const StartLanguageModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return null;
};

export const ProfileDashboard = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const { user } = useAuth();
  const { userProfile, isLoading, updateUserProfile } = useUserProfile();
  const navigate = useNavigate();

  const handleModeChange = (mode: string) => {
    if (mode === 'home') {
      navigate('/');
    } else if (mode === 'games') {
      navigate('/games');
    }
  };


  const getUserLanguageData = () => {
    if (!userProfile || Object.keys(userProfile.languages).length === 0) {
      return [];
    }

    return Object.entries(userProfile.languages).map(([language, data], index) => {

      let progressPercent = 100;

      if (data.proficiencyLevel === 'beginner') {
        progressPercent = Math.min(100, Math.round((data.experiencePoints / 1000) * 100));
      } else if (data.proficiencyLevel === 'intermediate') {
        progressPercent = Math.min(100, Math.round(((data.experiencePoints - 1000) / 2000) * 100));
      } else if (data.proficiencyLevel === 'advanced') {
        progressPercent = Math.min(100, Math.round(((data.experiencePoints - 3000) / 3000) * 100));
      }


      const estimatedHours = Math.max(1, Math.floor(data.experiencePoints / 100));

      const color = getLanguageColor(language);

      return {
        language: language.charAt(0).toUpperCase() + language.slice(1),
        level: data.proficiencyLevel.charAt(0).toUpperCase() + data.proficiencyLevel.slice(1),
        progress: progressPercent,
        totalHours: estimatedHours,
        streak: userProfile.streak.currentStreak,
        xp: data.experiencePoints,
        wordCount: data.wordsLearned,
        lessonsCompleted: data.lessonsCompleted,
        color
      };
    });
  };


  const getUserStats = () => {
    if (!userProfile || Object.keys(userProfile.languages).length === 0) {
      return {
        wordsLearned: 0,
        lessonsCompleted: 0,
        streak: 0,
        totalXP: 0,
        activeDays: 0,
        languages: 0,
        weeklyGoal: 50,
        weeklyProgress: 0
      };
    }

    const totalWords = Object.values(userProfile.languages).reduce(
      (sum, lang) => sum + lang.wordsLearned, 0
    );

    const totalLessons = Object.values(userProfile.languages).reduce(
      (sum, lang) => sum + lang.lessonsCompleted, 0
    );

    const totalXP = Object.values(userProfile.languages).reduce(
      (sum, lang) => sum + lang.experiencePoints, 0
    );


    const weeklyGoal = userProfile.settings.dailyGoal * 7;



    const weeklyProgress = Math.min(100, Math.round((totalXP * 0.1 / weeklyGoal) * 100));



    const activeDays = Math.min(30, Math.max(userProfile.streak.currentStreak,
      Math.floor(totalLessons / 2)));

    return {
      wordsLearned: totalWords,
      lessonsCompleted: totalLessons,
      streak: userProfile.streak.currentStreak,
      totalXP: totalXP,
      activeDays: activeDays,
      languages: Object.keys(userProfile.languages).length,
      weeklyGoal: weeklyGoal,
      weeklyProgress: weeklyProgress
    };
  };


  const handleLanguageClick = (language: string) => {

    if (userProfile) {
      updateUserProfile({
        settings: {
          ...userProfile.settings,
          preferredLanguage: language.toLowerCase()
        }
      });


      navigate('/');
    }
  };

  const userLanguageData = getUserLanguageData();
  const userStats = getUserStats();

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  if (isLoading) {
    return (
      <Center style={{ height: '100vh', width: '100vw' }}>
        <Stack align="center">
          <Loader size="lg" />
          <Text>Loading profile data...</Text>
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
        selectedMode="profile"
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
                <Box
                  style={{
                    position: 'absolute',
                    bottom: -80,
                    left: -80,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${accentBlue}20 0%, transparent 70%)`,
                    zIndex: 0
                  }}
                />

                <Group align="flex-start" style={{ position: 'relative', zIndex: 1 }}>
                  <Avatar
                    src={user?.photoURL}
                    size={120}
                    radius={90}
                    style={{
                      border: `3px solid ${accentBlue}30`,
                      boxShadow: `0 0 20px ${accentBlue}50`
                    }}
                  >
                    {firstName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Stack gap="xs">
                    <Box>
                      <Text
                        size="sm"
                        fw={500}
                        c="dimmed"
                        style={{
                          fontSize: '16px',
                          letterSpacing: '0.5px',
                          marginBottom: rem(4)
                        }}
                      >
                        Hello,
                      </Text>
                      <Title
                        order={1}
                        c="white"
                        style={{
                          fontSize: '32px',
                          marginBottom: rem(4),
                          background: `linear-gradient(90deg, #fff, ${accentBlue})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {firstName}!
                      </Title>
                      <Text c="dimmed" size="sm" style={{ fontSize: '14px' }}>
                        {user?.email}
                      </Text>
                    </Box>

                    <Group mt="xs" gap="md">
                      <Badge
                        variant="dot"
                        color="blue"
                        size="lg"
                        radius="md"
                        style={{
                          padding: '0 12px',
                          height: '28px'
                        }}
                      >
                        {userStats.totalXP > 0 ? `${Math.floor(userStats.totalXP / 500)} Level` : 'New User'}
                      </Badge>

                      {userStats.languages > 0 && (
                        <Badge
                          variant="dot"
                          color="green"
                          size="lg"
                          radius="md"
                          style={{
                            padding: '0 12px',
                            height: '28px'
                          }}
                        >
                          {userStats.languages} {userStats.languages === 1 ? 'Language' : 'Languages'}
                        </Badge>
                      )}
                    </Group>
                  </Stack>

                  <Flex
                    gap="xl"
                    ml="auto"
                    align="center"
                    style={{
                      background: 'rgba(20, 20, 30, 0.4)',
                      padding: '16px 24px',
                      borderRadius: rem(16)
                    }}
                  >
                    <Stack align="center" gap={8}>
                      <Box
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${accentBlue}20`,
                        }}
                      >
                        <IconTrophy size={24} color={accentBlue} />
                      </Box>
                      <Text fw={700} size="xl" style={{ color: 'white', fontSize: '22px' }}>
                        {userStats.totalXP}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: '12px' }}>
                        Total XP
                      </Text>
                    </Stack>

                    <Stack align="center" gap={8}>
                      <RingProgress
                        size={50}
                        thickness={4}
                        roundCaps
                        sections={[{ value: userStats.weeklyProgress, color: accentGreen }]}
                        label={
                          <Center style={{ width: '100%', height: '100%' }}>
                            <IconCalendar size={20} color={accentGreen} />
                          </Center>
                        }
                      />
                      <Text fw={700} size="xl" style={{ color: 'white', fontSize: '22px' }}>
                        {userStats.weeklyProgress}%
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: '12px' }}>
                        Weekly Goal
                      </Text>
                    </Stack>
                  </Flex>
                </Group>
              </Paper>
            </motion.div>

            <Box mb="lg">
              <Group align="center" mb="xs">
                <IconHeartFilled size={20} color={accentPurple} />
                <Title
                  order={2}
                  style={{
                    fontSize: '22px',
                    fontWeight: 600
                  }}
                >
                  Your Languages
                </Title>
              </Group>
              <Text size="sm" c="dimmed" mb="lg" style={{ maxWidth: '600px' }}>
                Continue your language journey. Track progress across multiple languages and stay on top of your learning goals.
              </Text>
            </Box>

            <Grid gutter="lg" mb="xl">
              {userLanguageData.length > 0 ? (
                userLanguageData.map((lang, index) => (
                  <Grid.Col key={lang.language} span={{ base: 12, md: 4 }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <LanguageProgressCard
                        data={lang}
                        color={lang.color || getLanguageColor(lang.language.toLowerCase())}
                        onClick={() => handleLanguageClick(lang.language)}
                      />
                    </motion.div>
                  </Grid.Col>
                ))
              ) : (
                <Grid.Col span={12}>
                  <Paper p="xl" radius="md" style={glassEffect}>
                    <Stack align="center" py="xl">
                      <IconLanguage size={48} color={accentBlue} opacity={0.6} />
                      <Text size="lg" fw={600}>No languages yet</Text>
                      <Text c="dimmed" ta="center" style={{ maxWidth: 400 }}>
                        Start your language learning journey by practicing conversations
                      </Text>
                      <Button
                        mt="md"
                        color="blue"
                        leftSection={<IconArrowRight size={16} />}
                        onClick={() => navigate('/')}
                      >
                        Start Learning
                      </Button>
                    </Stack>
                  </Paper>
                </Grid.Col>
              )}

              {userLanguageData.length > 0 && (
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: userLanguageData.length * 0.1 }}
                  >
                    <StartLanguageCard onClick={() => navigate('/')} />
                  </motion.div>
                </Grid.Col>
              )}
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
                  Stats & Insights
                </Title>
              </Group>
              <Text size="sm" c="dimmed" mb="lg" style={{ maxWidth: '600px' }}>
                Track your learning metrics and performance over time.
              </Text>
            </Box>

            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <StatCard
                    title="Total XP"
                    value={userStats.totalXP}
                    unit="points"
                    icon={<IconTrophy size={18} />}
                    color={accentBlue}
                  />
                </motion.div>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <StatCard
                    title="Words Learned"
                    value={userStats.wordsLearned}
                    unit="vocabulary"
                    icon={<IconVocabulary size={18} />}
                    color={accentPurple}
                  />
                </motion.div>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <StatCard
                    title="Lessons Completed"
                    value={userStats.lessonsCompleted}
                    unit="lessons"
                    icon={<IconSchool size={18} />}
                    color={accentGreen}
                  />
                </motion.div>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <StatCard
                    title="Daily Streak"
                    value={userStats.streak}
                    unit="days"
                    icon={<IconFlame size={18} />}
                    color="#ff7b5c"
                  />
                </motion.div>
              </Grid.Col>
            </Grid>
          </Container>
        </Box>
      </AppShell.Main>

      <StartLanguageModal
        isOpen={showAddLanguageModal}
        onClose={() => setShowAddLanguageModal(false)}
      />
    </AppShell>
  );
};

export default ProfileDashboard;