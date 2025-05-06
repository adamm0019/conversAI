import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
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
  AppShell
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
  IconHeartFilled
} from '@tabler/icons-react';
import { Header } from '../components/Header/Header';
import { motion } from 'framer-motion';
import { keyframes } from '@emotion/react';

// Define animations
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

// Colors
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

// Stat Card Component
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

// Language Card Component
interface LanguageProgressCardProps {
  data: {
    language: string;
    level: string;
    progress: number;
    totalHours: number;
    streak: number;
  };
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

const LanguageProgressCard: React.FC<LanguageProgressCardProps> = ({ data, color = accentBlue }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <Paper 
      p="xl" 
      radius="lg" 
      style={{
        ...glassEffect,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered ? `0 10px 20px rgba(0, 0, 0, 0.2)` : 'none'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative glow in corner */}
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
      
      <Group mt="xl" justify="space-between">
        <Stack gap={3}>
          <Text size="sm" c="dimmed" style={{ fontSize: '13px' }}>Total Hours</Text>
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

// Mock data
const mockData = {
  totalSessions: 24,
  totalMinutes: 360,
  averageScore: 85,
  streakDays: 7,
  weeklyGoal: 75,
  weeklyProgress: 65,
  languageDetails: [
    { language: 'Spanish', level: 'B2', progress: 78, totalHours: 45, streak: 7 },
    { language: 'French', level: 'B1', progress: 45, totalHours: 20, streak: 3 },
    { language: 'German', level: 'A2', progress: 90, totalHours: 15, streak: 5 }
  ],
  achievements: [
    {
      id: '1',
      title: 'First Lesson',
      description: 'Completed your first language lesson',
      icon: <IconBrain size={24} />,
      earned: true,
      date: '2024-02-15'
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Maintained a 7-day study streak',
      icon: <IconClockHour4 size={24} />,
      earned: true,
      date: '2024-02-10'
    },
    {
      id: '3',
      title: 'Polyglot Path',
      description: 'Started learning a second language',
      icon: <IconFlag size={24} />,
      earned: true,
      date: '2024-01-20'
    }
  ]
};

export const ProfileDashboard = () => {
  const { user } = useUser();
  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'there';

  const handleModeChange = (mode: string) => {
    console.log('Mode changed:', mode);
  };

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
        onResetAPIKey={() => console.log('Reset API key')}
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
            {/* Top section with user profile */}
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
                {/* Decorative elements */}
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
                    src={user?.imageUrl}
                    size={120}
                    radius={90}
                    style={{ 
                      border: `3px solid ${accentBlue}30`,
                      boxShadow: `0 0 20px ${accentBlue}50`
                    }}
                  />
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
                        {user?.primaryEmailAddress?.emailAddress}
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
                        Level {Math.floor(mockData.totalSessions / 10)}
                      </Badge>
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
                        {mockData.languageDetails.length} Languages
                      </Badge>
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
                        {mockData.totalSessions}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: '12px' }}>
                        Total Sessions
                      </Text>
                    </Stack>

                    <Stack align="center" gap={8}>
                      <RingProgress
                        size={50}
                        thickness={4}
                        roundCaps
                        sections={[{ value: mockData.weeklyProgress, color: accentGreen }]}
                        label={
                          <Center style={{ width: '100%', height: '100%' }}>
                            <IconCalendar size={20} color={accentGreen} />
                          </Center>
                        }
                      />
                      <Text fw={700} size="xl" style={{ color: 'white', fontSize: '22px' }}>
                        {mockData.weeklyProgress}%
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: '12px' }}>
                        Weekly Goal
                      </Text>
                    </Stack>
                  </Flex>
                </Group>
              </Paper>
            </motion.div>

            {/* Practice section heading */}
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
                  Practice
                </Title>
              </Group>
              <Text size="sm" c="dimmed" mb="lg" style={{ maxWidth: '600px' }}>
                Continue your language journey. Track progress across multiple languages and stay on top of your learning goals.
              </Text>
            </Box>

            {/* Language cards grid */}
            <Grid gutter="lg" mb="xl">
              {mockData.languageDetails.map((lang, index) => (
                <Grid.Col key={lang.language} span={{ base: 12, md: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <LanguageProgressCard 
                      data={lang} 
                      color={index === 0 ? accentBlue : index === 1 ? accentPurple : accentGreen} 
                    />
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>

            {/* Stats Section */}
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
                    title="Total Sessions"
                    value={mockData.totalSessions}
                    unit="completed"
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
                    title="Practice Time"
                    value={mockData.totalMinutes}
                    unit="minutes"
                    icon={<IconClockHour4 size={18} />}
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
                    title="Average Score"
                    value={`${mockData.averageScore}%`}
                    unit="proficiency"
                    icon={<IconBrain size={18} />}
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
                    title="Weekly Goal"
                    value={`${mockData.weeklyProgress}`}
                    unit={`of ${mockData.weeklyGoal} minutes`}
                    icon={<IconCalendar size={18} />}
                    color="#ff7b5c"
                    chart={
                      <Box mt={15}>
                        <Progress
                          value={mockData.weeklyProgress}
                          size="md"
                          radius="xl"
                          color="#ff7b5c"
                          style={{ 
                            backgroundColor: 'rgba(40, 40, 50, 0.5)',
                            height: rem(8)
                          }} 
                        />
                      </Box>
                    } 
                  />
                </motion.div>
              </Grid.Col>
            </Grid>
          </Container>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export default ProfileDashboard;