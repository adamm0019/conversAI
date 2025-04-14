import React, { useState, useEffect } from 'react';
import {
  AppShell,
  Container,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Box,
  ActionIcon,
  Progress,
  Stack,
  Button,
  useMantineTheme,
  Transition,
  rem,
  Overlay,
  Center,
  ThemeIcon,
  RingProgress,
  HoverCard,
  Tooltip,
  Avatar,
  Indicator
} from '@mantine/core';
import {
  IconBrain,
  IconLock,
  IconTrophy,
  IconStar,
  IconFlame,
  IconChevronRight,
  IconArrowUpRight,
  IconArrowRight,
  IconArrowNarrowRight,
  IconBooks,
  IconTimeline,
  IconMountain,
  IconPlayerPlay,
  IconCheck,
  IconCircleCheck,
  IconStarFilled,
  IconArrowRightCircle
} from '@tabler/icons-react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/Header/Header';

// Interfaces
interface PathInfo {
  title: string;
  color: string;
  icon: JSX.Element;
  description: string;
}

interface LearningPaths {
  main: PathInfo;
  expert: PathInfo;
  challenge: PathInfo;
}

type PathType = keyof LearningPaths;

interface Module {
  id: string;
  title: string;
  description: string;
  path: PathType;
  level: number;
  progress: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  skills: string[];
  achievements?: string[];
  lessonCount: number;
  estimatedTime: string;
  nextLesson?: string;
}

// Custom animations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const ModulesPage = () => {
  const theme = useMantineTheme();
  const [selectedPath, setSelectedPath] = useState<PathType>('main');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [progressOverview, setProgressOverview] = useState({
    totalCompleted: 0,
    totalModules: 0,
    streakDays: 7,
    nextMilestone: 95
  });

  const handleModeChange = (mode: string) => {
    console.log('Mode changed:', mode);
  };

  const learningPaths: LearningPaths = {
    main: {
      title: 'Core',
      color: 'blue',
      icon: <IconBrain size={24} />,
      description: 'Master essential language skills through structured lessons'
    },
    expert: {
      title: 'Expert',
      color: 'violet',
      icon: <IconBooks size={24} />,
      description: 'Advanced language mastery for experienced learners'
    },
    challenge: {
      title: 'Challenge',
      color: 'orange',
      icon: <IconFlame size={24} />,
      description: 'Test your skills with immersive challenges'
    }
  };

  const modules: Module[] = [
    {
      id: '1',
      title: 'Language Foundations',
      description: 'Essential vocabulary and grammar for beginners',
      path: 'main',
      level: 1,
      progress: 100,
      isCompleted: true,
      skills: ['Basic Vocabulary', 'Simple Grammar', 'Pronunciation'],
      achievements: ['Perfect Score', 'Fast Learner'],
      lessonCount: 12,
      estimatedTime: '4-6 hours',
    },
    {
      id: '2',
      title: 'Everyday Conversations',
      description: 'Common phrases and dialogue patterns for daily interactions',
      path: 'main',
      level: 1,
      progress: 65,
      skills: ['Speaking', 'Listening', 'Cultural Context'],
      achievements: ['Streak Master'],
      lessonCount: 10,
      estimatedTime: '5-7 hours',
      nextLesson: 'Ordering at Restaurants',
    },
    // More modules - truncated for artifact size
    {
      id: '3',
      title: 'Intermediate Grammar',
      description: 'More complex language structures and tenses',
      path: 'main',
      level: 2,
      progress: 30,
      skills: ['Verb Tenses', 'Sentence Structure', 'Reading Comprehension'],
      lessonCount: 14,
      estimatedTime: '7-9 hours',
      nextLesson: 'Past Tense Conjugation',
    },
    {
      id: '4',
      title: 'Advanced Communication',
      description: 'Fluent expression in diverse contexts with rich vocabulary',
      path: 'main',
      level: 2,
      progress: 0,
      isLocked: true,
      skills: ['Complex Conversations', 'Nuanced Expression', 'Cultural Fluency'],
      lessonCount: 15,
      estimatedTime: '10-12 hours',
    },
    {
      id: '5',
      title: 'Business Language',
      description: 'Professional vocabulary and communication strategies',
      path: 'expert',
      level: 1,
      progress: 45,
      skills: ['Business Vocabulary', 'Formal Writing', 'Negotiations'],
      lessonCount: 8,
      estimatedTime: '6-8 hours',
      nextLesson: 'Email Correspondence',
    },
    {
      id: '6',
      title: 'Academic Language',
      description: 'Scholarly and technical language skills for research',
      path: 'expert',
      level: 1,
      progress: 20,
      skills: ['Academic Writing', 'Research Terminology', 'Presentations'],
      lessonCount: 12,
      estimatedTime: '8-10 hours',
      nextLesson: 'Academic Essay Structure',
    },
    {
      id: '7',
      title: 'Daily Challenges',
      description: 'Quick, fun exercises to test various language skills',
      path: 'challenge',
      level: 1,
      progress: 50,
      skills: ['Vocabulary Recall', 'Quick Translation', 'Listening Comprehension'],
      achievements: ['7-Day Streak'],
      lessonCount: 30,
      estimatedTime: '10-15 min daily',
      nextLesson: 'Weather Vocabulary Challenge',
    }
  ];

  // Calculate path and level statistics on path/level change
  useEffect(() => {
    const filteredModules = modules.filter(module => module.path === selectedPath);
    const totalModules = filteredModules.length;
    const completedModules = filteredModules.filter(m => m.isCompleted).length;

    setProgressOverview({
      totalCompleted: completedModules,
      totalModules: totalModules,
      streakDays: 7,
      nextMilestone: 95
    });
  }, [selectedPath, selectedLevel]);

  // Filter modules by selected path and level
  const filteredModules = modules.filter(
      module => module.path === selectedPath && module.level === selectedLevel
  );

  // Get all available levels for the selected path
  const availableLevels = [...new Set(
      modules
          .filter(module => module.path === selectedPath)
          .map(module => module.level)
  )].sort((a, b) => a - b);

  // Calculate overall progress for the selected path
  const pathModules = modules.filter(module => module.path === selectedPath);
  const pathProgress = pathModules.length > 0
      ? Math.round(pathModules.reduce((sum, module) => sum + module.progress, 0) / pathModules.length)
      : 0;

  return (
      <AppShell
          header={{ height: 60 }}
          padding={0}
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            backgroundColor: '#0f1012',
            backgroundImage: 'radial-gradient(circle at top right, rgba(37, 38, 43, 0.2) 0%, transparent 70%)',
          }}
      >
        <Header
            selectedMode="tutor"
            onModeChange={handleModeChange}
            onResetAPIKey={() => console.log('Reset API key')}
            showSettings={true} // Changed to true to display settings icon
        />

        <AppShell.Main style={{
          backgroundColor: '#0f1012',
          backgroundImage: 'radial-gradient(circle at top right, rgba(37, 38, 43, 0.2) 0%, transparent 70%)'
        }}><Box py="xl" mih="calc(100vh - 60px)" pos="relative">
          {/* Background decoration elements */}
          <Box
              style={{
                position: 'absolute',
                top: rem(-80),
                right: rem(-80),
                width: rem(400),
                height: rem(400),
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(70, 90, 180, 0.05) 0%, transparent 70%)`,
                zIndex: 0
              }}
          />

          <Box
              style={{
                position: 'absolute',
                bottom: rem(-100),
                left: rem(-100),
                width: rem(300),
                height: rem(300),
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(70, 90, 180, 0.05) 0%, transparent 70%)`,
                zIndex: 0
              }}
          />

          {/* Main content */}
          <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
            {/* Progress overview and learning path selection */}
            <Box mb={rem(50)}>
              <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
              >
                <Group gap="xl" align="flex-start" wrap="nowrap" mb="xl">
                  {/* Learning path selector */}
                  <Paper
                      p="lg"
                      radius="md"
                      style={{
                        flex: 1,
                        background: 'rgba(37, 38, 43, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                  >
                    <Stack gap="md">
                      <Title order={2} c="white" size="h3">Learning Journey</Title>

                      {/* Path selector cards */}
                      <Group gap="xs" wrap="nowrap">
                        {(Object.entries(learningPaths) as [PathType, PathInfo][]).map(([key, path], index) => (
                            <motion.div
                                key={key}
                                initial="hidden"
                                animate="visible"
                                variants={fadeIn}
                                custom={index}
                                style={{ flex: 1 }}
                            >
                              <Paper
                                  p="md"
                                  radius="md"
                                  style={{
                                    cursor: 'pointer',
                                    background: selectedPath === key
                                        ? `linear-gradient(135deg, var(--mantine-color-${path.color}-9) 0%, var(--mantine-color-${path.color}-7) 100%)`
                                        : 'rgba(32, 33, 36, 0.6)',
                                    border: `1px solid ${selectedPath === key
                                        ? `var(--mantine-color-${path.color}-6)`
                                        : 'rgba(255, 255, 255, 0.05)'}`,
                                    transition: 'all 0.3s ease',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column'
                                  }}
                                  onClick={() => setSelectedPath(key)}
                              >
                                <Group gap="sm" mb="xs">
                                  <ThemeIcon
                                      variant={selectedPath === key ? "filled" : "light"}
                                      color={path.color}
                                      size="lg"
                                      radius="xl"
                                  >
                                    {path.icon}
                                  </ThemeIcon>
                                  <Title order={4} c={selectedPath === key ? "white" : "dimmed"}>
                                    {path.title}
                                  </Title>
                                </Group>

                                <Text
                                    size="sm"
                                    c={selectedPath === key ? "white" : "dimmed"}
                                    lineClamp={2}
                                    style={{ marginBottom: 'auto' }}
                                >
                                  {path.description}
                                </Text>

                                {/* Path progress indicator */}
                                <Group gap="xs" mt="md" align="center">
                                  <Progress
                                      value={pathProgress}
                                      color={path.color}
                                      size="sm"
                                      radius="xl"
                                      style={{ flex: 1 }}
                                  />
                                  <Text size="xs" c={selectedPath === key ? "white" : "dimmed"}>
                                    {pathProgress}%
                                  </Text>
                                </Group>
                              </Paper>
                            </motion.div>
                        ))}
                      </Group>
                    </Stack>
                  </Paper>

                  {/* Stats/Progress snapshot */}
                  <Paper
                      p="lg"
                      radius="md"
                      style={{
                        width: rem(280),
                        background: 'rgba(37, 38, 43, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                  >
                    <Group gap="md" mb="lg" align="flex-start">
                      <RingProgress
                          size={90}
                          roundCaps
                          thickness={8}
                          sections={[
                            { value: (progressOverview.totalCompleted / progressOverview.totalModules) * 100, color: `var(--mantine-color-${learningPaths[selectedPath].color}-6)` }
                          ]}
                          label={
                            <Center>
                              <Text c={`${learningPaths[selectedPath].color}`} fw={700} size="xl" ta="center">
                                {Math.round((progressOverview.totalCompleted / progressOverview.totalModules) * 100)}%
                              </Text>
                            </Center>
                          }
                      />

                      <div>
                        <Text c="dimmed" size="sm">Learning Progress</Text>
                        <Text c="white" fw={500}>
                          {progressOverview.totalCompleted} of {progressOverview.totalModules} modules
                        </Text>
                        <Group gap="xs" mt="xs">
                          <Badge
                              color={learningPaths[selectedPath].color}
                              variant="light"
                              leftSection={<IconFlame size={12} />}
                          >
                            {progressOverview.streakDays} day streak
                          </Badge>
                        </Group>
                      </div>
                    </Group>

                    <Box mt="md">
                      {/* Next milestone */}
                      <Text c="dimmed" size="sm" mb="xs">Next Milestone</Text>
                      <Group gap="xs" align="center" wrap="nowrap">
                        <Box style={{ flex: 1 }}>
                          <Text c="white" fw={500} mb={4}>Conversation Master</Text>
                          <Progress
                              value={progressOverview.nextMilestone}
                              color={`${learningPaths[selectedPath].color}`}
                              size="sm"
                              radius="xl"
                          />
                        </Box>
                        <Text c="dimmed" size="sm">{progressOverview.nextMilestone}%</Text>
                      </Group>
                    </Box>

                    <Button
                        mt="lg"
                        variant="light"
                        color={learningPaths[selectedPath].color}
                        rightSection={<IconArrowRight size={16} />}
                        radius="xl"
                        style={{ marginTop: 'auto' }}
                    >
                      Continue Learning
                    </Button>
                  </Paper>
                </Group>
              </motion.div>

              {/* Journey map / level selector */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Paper
                    radius="lg"
                    p="lg"
                    style={{
                      background: 'rgba(37, 38, 43, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                >
                  <Title order={3} c="white" mb="md">Your Learning Path</Title>

                  {/* Mountain journey visualization */}
                  <Box pos="relative" h={rem(100)} maw="100%" mb="lg">
                    {/* Path line */}
                    <Box
                        style={{
                          position: 'absolute',
                          height: rem(2),
                          background: `linear-gradient(90deg, var(--mantine-color-${learningPaths[selectedPath].color}-6) 0%, var(--mantine-color-${learningPaths[selectedPath].color}-3) 100%)`,
                          top: rem(36),
                          left: 0,
                          right: 0,
                          zIndex: 1
                        }}
                    />

                    {/* Level nodes */}
                    <Group gap={0} justify="space-between" pos="relative" style={{ zIndex: 2 }}>
                      {availableLevels.map((level, index) => {
                        // Calculate completion for this level
                        const levelModules = modules.filter(m => m.path === selectedPath && m.level === level);
                        const completedInLevel = levelModules.filter(m => m.isCompleted).length;
                        const levelProgress = levelModules.length > 0
                            ? (completedInLevel / levelModules.length) * 100
                            : 0;

                        // Determine if this level is locked
                        const isLocked = index > 0 && levelProgress === 0 &&
                            modules.filter(m => m.path === selectedPath && m.level === availableLevels[index-1])
                                .some(m => !m.isCompleted);

                        return (
                            <Box key={level} style={{ width: `${100 / availableLevels.length}%` }}>
                              <Group justify="center">
                                <Tooltip
                                    label={isLocked ? "Complete previous levels to unlock" : `Level ${level}`}
                                    position="top"
                                >
                                  <Box
                                      style={{
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        opacity: isLocked ? 0.6 : 1
                                      }}
                                      onClick={() => !isLocked && setSelectedLevel(level)}
                                  >
                                    <Paper
                                        p={rem(10)}
                                        radius="xl"
                                        style={{
                                          width: rem(72),
                                          height: rem(72),
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          background: selectedLevel === level
                                              ? `linear-gradient(135deg, var(--mantine-color-${learningPaths[selectedPath].color}-9) 0%, var(--mantine-color-${learningPaths[selectedPath].color}-7) 100%)`
                                              : isLocked
                                                  ? 'rgba(40, 40, 45, 0.8)'
                                                  : 'rgba(45, 46, 50, 0.8)',
                                          border: `2px solid ${selectedLevel === level
                                              ? `var(--mantine-color-${learningPaths[selectedPath].color}-5)`
                                              : isLocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)'}`,
                                          boxShadow: selectedLevel === level
                                              ? `0 0 15px rgba(var(--mantine-color-${learningPaths[selectedPath].color}-rgb), 0.5)`
                                              : 'none',
                                          transition: 'all 0.3s ease'
                                        }}
                                    >
                                      {isLocked ? (
                                          <IconLock size={24} color="#6e7079" />
                                      ) : levelProgress === 100 ? (
                                          <IconCircleCheck size={28} color="#66bb6a" />
                                      ) : (
                                          <Text fw={700} size="xl" c={selectedLevel === level ? "white" : "dimmed"}>
                                            {level}
                                          </Text>
                                      )}

                                      <Text size="xs" mt={4} c={selectedLevel === level ? "white" : "dimmed"}>
                                        {isLocked
                                            ? "Locked"
                                            : levelProgress === 100
                                                ? "Complete"
                                                : levelProgress > 0
                                                    ? `${Math.round(levelProgress)}%`
                                                    : "New"}
                                      </Text>
                                    </Paper>
                                  </Box>
                                </Tooltip>
                              </Group>

                              {/* Module count indicator */}
                              <Text
                                  m="center"
                                  size="xs"
                                  c="dimmed"
                                  mt="xs"
                              >
                                {levelModules.length} {levelModules.length === 1 ? 'module' : 'modules'}
                              </Text>
                            </Box>
                        );
                      })}
                    </Group>
                  </Box>
                </Paper>
              </motion.div>
            </Box>

            {/* Module cards */}
            <Title c="white" order={2} mb="lg">
              Level {selectedLevel} Modules
            </Title>

            <Box mb="xl">
              {filteredModules.length > 0 ? (
                  <div style={{ position: 'relative' }}>
                    {/* Module grid */}
                    <Group align="stretch" wrap="wrap">
                      {filteredModules.map((module, index) => {
                        const [ref, inView] = useInView({
                          triggerOnce: true,
                          threshold: 0.1,
                        });

                        return (
                            <Box
                                key={module.id}
                                ref={ref}
                                style={{
                                  width: 'calc(50% - 16px)',
                                  margin: 0
                                }}
                            >
                              <motion.div
                                  initial={{ opacity: 0, y: 30 }}
                                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                  transition={{
                                    duration: 0.6,
                                    delay: index * 0.1,
                                    ease: [0.25, 1, 0.5, 1]
                                  }}
                                  style={{ height: '100%' }}
                              >
                                <Paper
                                    p={0}
                                    radius="lg"
                                    style={{
                                      height: '100%',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      overflow: 'hidden',
                                      background: 'rgba(37, 38, 43, 0.7)',
                                      backdropFilter: 'blur(10px)',
                                      border: module.isLocked
                                          ? '1px solid rgba(255, 255, 255, 0.03)'
                                          : `1px solid rgba(var(--mantine-color-${learningPaths[module.path].color}-rgb), 0.3)`,
                                      transition: 'all 0.3s ease',
                                      position: 'relative',
                                      cursor: module.isLocked ? 'default' : 'pointer',
                                      filter: module.isLocked ? 'grayscale(60%)' : 'none',
                                      opacity: module.isLocked ? 0.7 : 1,
                                      '&:hover': {
                                        transform: module.isLocked ? 'none' : 'translateY(-5px)',
                                        boxShadow: module.isLocked
                                            ? 'none'
                                            : `0 10px 25px -5px rgba(var(--mantine-color-${learningPaths[module.path].color}-rgb), 0.25)`
                                      }
                                    }}
                                >
                                  {/* Module image with overlay */}
                                  <Box pos="relative" h={rem(140)}>
                                    <div
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          background: module.isCompleted
                                              ? `linear-gradient(135deg, rgba(30, 70, 32, 0.9), rgba(16, 45, 20, 0.95))`
                                              : module.isLocked
                                                  ? `linear-gradient(135deg, rgba(30, 30, 35, 0.9), rgba(20, 20, 25, 0.95))`
                                                  : `linear-gradient(135deg, rgba(var(--mantine-color-${learningPaths[module.path].color}-rgb), 0.6), rgba(var(--mantine-color-${learningPaths[module.path].color}-rgb), 0.9))`,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: rem(20)
                                        }}
                                    >
                                      <div style={{
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: rem(8)
                                      }}>
                                        {module.isLocked ? (
                                            <IconLock size={36} color="#6e7079" />
                                        ) : module.isCompleted ? (
                                            <IconCircleCheck size={36} color="#66bb6a" />
                                        ) : (
                                            learningPaths[module.path].icon
                                        )}
                                        <Text c="white" fw={600} size="sm">
                                          {module.isCompleted
                                              ? "COMPLETED"
                                              : module.isLocked
                                                  ? "LOCKED"
                                                  : module.progress > 0
                                                      ? `${module.progress}% COMPLETE`
                                                      : "START LEARNING"}
                                        </Text>
                                      </div>
                                    </div>

                                    {/* Status indicator */}
                                    <Box pos="absolute" top={rem(16)} right={rem(16)}>
                                      {module.isLocked ? (
                                          <ThemeIcon radius="xl" size="md" color="dark">
                                            <IconLock size={16} />
                                          </ThemeIcon>
                                      ) : module.isCompleted ? (
                                          <ThemeIcon radius="xl" size="md" color="green">
                                            <IconCheck size={16} />
                                          </ThemeIcon>
                                      ) : (
                                          <Badge
                                              radius="xl"
                                              color={learningPaths[module.path].color}
                                          >
                                            {module.progress}%
                                          </Badge>
                                      )}
                                    </Box>

                                    {/* Achievement badges */}
                                    {module.achievements && module.achievements.length > 0 && (
                                        <Box pos="absolute" top={rem(16)} left={rem(16)}>
                                          <Group gap={8}>
                                            {module.achievements.map((achievement, i) => (
                                                <Tooltip key={i} label={achievement}>
                                                  <ThemeIcon radius="xl" size="md" color="yellow" variant="filled">
                                                    <IconStarFilled size={12} />
                                                  </ThemeIcon>
                                                </Tooltip>
                                            ))}
                                          </Group>
                                        </Box>
                                    )}
                                  </Box>

                                  {/* Module content */}
                                  <Box p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Title order={4} c="white" mb="xs" lineClamp={1}>
                                      {module.title}
                                    </Title>

                                    <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                                      {module.description}
                                    </Text>

                                    {/* Skills */}
                                    <Group gap="xs" mb="md">
                                      {module.skills.slice(0, 2).map((skill, i) => (
                                          <Badge
                                              key={i}
                                              variant="dot"
                                              color={module.isLocked ? 'gray' : learningPaths[module.path].color}
                                              size="sm"
                                          >
                                            {skill}
                                          </Badge>
                                      ))}
                                      {module.skills.length > 2 && (
                                          <Tooltip label={module.skills.slice(2).join(', ')}>
                                            <Badge variant="dot" color="gray" size="sm">
                                              +{module.skills.length - 2}
                                            </Badge>
                                          </Tooltip>
                                      )}
                                    </Group>

                                    {/* Module stats */}
                                    <Group gap="lg" mb="md" style={{ marginTop: 'auto' }}>
                                      <Group gap="xs">
                                        <Text size="xs" c="dimmed">Lessons:</Text>
                                        <Text size="xs" fw={500} c="white">{module.lessonCount}</Text>
                                      </Group>

                                      <Group gap="xs">
                                        <Text size="xs" c="dimmed">Time:</Text>
                                        <Text size="xs" fw={500} c="white">{module.estimatedTime}</Text>
                                      </Group>
                                    </Group>

                                    {/* Progress bar */}
                                    {!module.isLocked && (
                                        <Progress
                                            value={module.progress}
                                            color={module.isCompleted ? 'green' : learningPaths[module.path].color}
                                            size="sm"
                                            radius="xl"
                                            mb="md"
                                            styles={{
                                              root: {
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                              }
                                            }}
                                        />
                                    )}

                                    {/* Next lesson or action button */}
                                    {module.isLocked ? (
                                        <Badge
                                            fullWidth
                                            size="lg"
                                            color="gray"
                                            variant="filled"
                                            style={{ height: rem(36) }}
                                        >
                                          Complete Previous Modules
                                        </Badge>
                                    ) : module.nextLesson && !module.isCompleted ? (
                                        <Group gap="xs" align="center">
                                          <IconPlayerPlay size={16} color={`var(--mantine-color-${learningPaths[module.path].color}-5)`} />
                                          <Box style={{ flex: 1 }}>
                                            <Text size="xs" c="dimmed">Next:</Text>
                                            <Text size="sm" fw={500} c="white" lineClamp={1}>
                                              {module.nextLesson}
                                            </Text>
                                          </Box>
                                          <ActionIcon variant="subtle" color={learningPaths[module.path].color}>
                                            <IconArrowRightCircle size={20} />
                                          </ActionIcon>
                                        </Group>
                                    ) : (
                                        <Button
                                            fullWidth
                                            radius="md"
                                            variant={module.isCompleted ? "light" : "filled"}
                                            color={module.isCompleted ? "green" : learningPaths[module.path].color}
                                            rightSection={<IconArrowRight size={16} />}
                                        >
                                          {module.isCompleted ? 'Review' : module.progress > 0 ? 'Continue' : 'Start'}
                                        </Button>
                                    )}
                                  </Box>
                                </Paper>
                              </motion.div>
                            </Box>
                        );
                      })}
                    </Group>
                  </div>
              ) : (
                  <Paper
                      p="xl"
                      radius="md"
                      style={{
                        background: 'rgba(37, 38, 43, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        textAlign: 'center'
                      }}
                  >
                    <Stack gap="md" align="center">
                      <ThemeIcon size="xl" radius="xl" color={learningPaths[selectedPath].color} variant="light">
                        <IconMountain size={24} />
                      </ThemeIcon>
                      <Text fw={500} c="white">No modules available at this level yet</Text>
                      <Text c="dimmed" size="sm">We're working on creating exciting new content for this level.</Text>
                      <Button
                          variant="light"
                          color={learningPaths[selectedPath].color}
                          leftSection={<IconTimeline size={16} />}
                          onClick={() => setSelectedLevel(availableLevels[0])}
                          mt="md"
                      >
                        Return to Level {availableLevels[0]}
                      </Button>
                    </Stack>
                  </Paper>
              )}
            </Box>
          </Container>
        </Box>
        </AppShell.Main>
      </AppShell>
  );
};

export default ModulesPage;