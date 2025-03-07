import React, { useState } from 'react';
import { AppShell, Container, Title, Text, Paper, Group, Badge, ActionIcon, Progress, Stack } from '@mantine/core';
import { IconBrain, IconLock, IconTrophy, IconStar, IconFlame, IconMessageCircle } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/Header/Header';

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
  position: { x: number; y: number };
  progress: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  skills: string[];
  achievements?: string[];
  connections: string[];
}

const ModulesPage = () => {
  const [selectedPath, setSelectedPath] = useState<PathType>('main');
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const learningPaths: LearningPaths = {
    main: {
      title: 'Core Language Track',
      color: 'blue',
      icon: <IconBrain size={24} />,
      description: 'Master essential language skills'
    },
    expert: {
      title: 'Expert Track',
      color: 'violet',
      icon: <IconStar size={24} />,
      description: 'Advanced language mastery'
    },
    challenge: {
      title: 'Challenge Track',
      color: 'orange',
      icon: <IconFlame size={24} />,
      description: 'Test your skills'
    }
  };

  const modules: Module[] = [
    {
      id: '1',
      title: 'Language Core',
      description: 'Essential foundations of the language',
      path: 'main',
      position: { x: -1, y: 0 },
      progress: 100,
      isCompleted: true,
      skills: ['Vocabulary', 'Basic Grammar', 'Pronunciation'],
      achievements: ['Perfect Score', 'Fast Learner'],
      connections: ['2', '3']
    },
    {
      id: '2',
      title: 'Conversation Skills',
      description: 'Real-world speaking practice',
      path: 'main',
      position: { x: 0, y: -0.5 },
      progress: 65,
      isCompleted: false,
      skills: ['Speaking', 'Listening', 'Cultural Context'],
      achievements: ['Streak Master'],
      connections: ['4']
    },
    {
      id: '3',
      title: 'Expert Grammar',
      description: 'Advanced language structures',
      path: 'expert',
      position: { x: 0, y: 0.5 },
      progress: 30,
      isCompleted: false,
      skills: ['Complex Sentences', 'Idioms', 'Academic Writing'],
      connections: ['4']
    },
    {
      id: '4',
      title: 'Mastery',
      description: 'Complete language fluency',
      path: 'challenge',
      position: { x: 1, y: 0 },
      progress: 0,
      isLocked: true,
      skills: ['Native-level Speaking', 'Cultural Mastery', 'Teaching'],
      connections: []
    }
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: '#1A1B1E',
      }}
    >
      <Header
        selectedMode="tutor"
        onModeChange={(mode) => console.log('Mode changed:', mode)}
        onResetAPIKey={() => console.log('Reset API key')}
        showSettings={false}
      />

      <AppShell.Main>
        <Container size="xl" py="xl">
          <Stack m="xl">
            <div>
              <Title order={1} c="white" mb="xs">Learning Paths</Title>
              <Text c="dimmed">Master the language through structured learning paths</Text>
            </div>

            <Group grow>
              {(Object.entries(learningPaths) as [PathType, PathInfo][]).map(([key, path]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Paper
                    p="md"
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedPath === key ? '#25262B' : '#1A1B1E',
                      border: `1px solid ${selectedPath === key ? `var(--mantine-color-${path.color}-6)` : '#2C2E33'}`,
                    }}
                    onClick={() => setSelectedPath(key)}
                  >
                    <Group m="md">
                      {path.icon}
                      <div>
                        <Text size="lg" fw={700} c="white">{path.title}</Text>
                        <Text size="sm" c="dimmed">{path.description}</Text>
                      </div>
                    </Group>
                  </Paper>
                </motion.div>
              ))}
            </Group>

            <div style={{ position: 'relative', height: '500px', margin: '20px 0' }}>
              <svg
                style={{ 
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              >
                {modules.map(module =>
                  module.connections.map(targetId => {
                    const target = modules.find(m => m.id === targetId);
                    if (!target) return null;
                    
                    const startX = (module.position.x + 1) * 300 + 200;
                    const startY = module.position.y * 200 + 250;
                    const endX = (target.position.x + 1) * 300 + 200;
                    const endY = target.position.y * 200 + 250;
                    const controlX1 = startX + 100;
                    const controlX2 = endX - 100;

                    return (
                      <motion.path
                        key={`${module.id}-${targetId}`}
                        d={`M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`}
                        stroke={`var(--mantine-color-${learningPaths[module.path].color}-6)`}
                        strokeWidth={hoveredModule === module.id || hoveredModule === targetId ? "3" : "1"}
                        strokeDasharray={module.isLocked ? "5,5" : "none"}
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5 }}
                      />
                    );
                  })
                )}
              </svg>

              <AnimatePresence>
                {modules.map((module) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: (module.position.x + 1) * 300 + 200,
                      y: module.position.y * 200 + 250
                    }}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      zIndex: hoveredModule === module.id ? 2 : 1,
                    }}
                    onHoverStart={() => setHoveredModule(module.id)}
                    onHoverEnd={() => setHoveredModule(null)}
                  >
                    <Paper
                      p="xl"
                      radius="md"
                      style={{
                        width: '300px',
                        backgroundColor: module.isLocked ? '#1A1B1E' : '#25262B',
                        border: `1px solid ${
                          module.isLocked 
                            ? '#2C2E33' 
                            : `var(--mantine-color-${learningPaths[module.path].color}-6)`
                        }`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Stack m="xs">
                        <Group p="apart" align="flex-start">
                          <Group m="sm">
                            {module.isLocked ? (
                              <IconLock size={24} />
                            ) : module.isCompleted ? (
                              <IconTrophy size={24} color="var(--mantine-color-yellow-4)" />
                            ) : (
                              learningPaths[module.path].icon
                            )}
                            <div>
                              <Text fw={700} c="white">{module.title}</Text>
                              <Text size="sm" c="dimmed">{module.description}</Text>
                            </div>
                          </Group>
                          {!module.isLocked && (
                            <Badge 
                              variant="filled"
                              color={module.isCompleted ? 'green' : learningPaths[module.path].color}
                            >
                              {module.isCompleted ? 'Complete' : `${module.progress}%`}
                            </Badge>
                          )}
                        </Group>

                        <Group m="xs">
                          {module.skills.map((skill) => (
                            <Badge 
                              key={skill}
                              variant="outline"
                              color={module.isLocked ? 'gray' : learningPaths[module.path].color}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </Group>

                        {module.achievements && (
                          <Group m="xs">
                            {module.achievements.map((achievement) => (
                              <ActionIcon 
                                key={achievement}
                                variant="light"
                                color="yellow"
                                size="md"
                                title={achievement}
                              >
                                <IconStar size={16} />
                              </ActionIcon>
                            ))}
                          </Group>
                        )}

                        {!module.isLocked && (
                          <Progress
                            value={module.progress}
                            color={module.isCompleted ? 'green' : learningPaths[module.path].color}
                            size="sm"
                            radius="xl"
                          />
                        )}
                      </Stack>
                    </Paper>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default ModulesPage;