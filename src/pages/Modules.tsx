import React, { useState, useEffect, useRef } from 'react';
import {
  AppShell, Container, Paper, Group, Box, Text, Title, Stack,
  SimpleGrid, Progress, Button, ThemeIcon, rem, Center, Flex, Badge,
  Tooltip, ActionIcon
} from '@mantine/core';
import { motion } from 'framer-motion';
import { IconVocabulary, IconBooks, IconMessageChatbot, IconClockHour4, IconLock, IconBrain, IconTimeline, IconMountain, IconArrowRight, IconTrophy, IconRefresh } from '@tabler/icons-react';
import { AudioVisualiser } from '../components/AudioControls/AudioVisualiser';
import { Header } from '../components/Header/Header';
import { useModulePlanner, AIModule } from '../hooks/useModulePlanner';
import { keyframes } from '@emotion/react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useNavigate } from 'react-router-dom';
import { saveModulesToFirebase, checkModulesExist, deleteAllModules } from '../lib/firebase/moduleUtils';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';


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

const learningLevels = [
  { id: 'beginner', label: 'Beginner', icon: IconBrain, color: accentBlue },
  { id: 'intermediate', label: 'Intermediate', icon: IconBooks, color: accentGreen },
  { id: 'advanced', label: 'Advanced', icon: IconMountain, color: accentRed },
  { id: 'foundation', label: 'Foundation', icon: IconTimeline, color: accentYellow },
];

const getModuleIcon = (module: AIModule, color: string) => {
  const title = module.title.toLowerCase();
  const iconSize = 18;

  if (title.includes('vocab') || title.includes('vocabulary')) {
    return <IconVocabulary size={iconSize} stroke={1.5} />;
  } else if (title.includes('conversation') || title.includes('speaking')) {
    return <IconMessageChatbot size={iconSize} stroke={1.5} />;
  } else {
    return <IconBooks size={iconSize} stroke={1.5} />;
  }
};


const CustomThemeIcon = ({ size = 'md', radius = 'md', color = 'blue', variant = 'filled', children }: any) => (
  <Center
    style={{
      width: size === 'lg' ? rem(50) : rem(40),
      height: size === 'lg' ? rem(50) : rem(40),
      borderRadius: '50%',
      backgroundColor: variant === 'filled' ? color : `${color}20`,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: variant === 'light' ? `1px solid ${color}` : 'none'
    }}
  >
    {children}
  </Center>
);

const ModulesPage = () => {
  const [activeLevel, setActiveLevel] = useState('intermediate');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSpoken, setHasSpoken] = useState(false);
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savingModules, setSavingModules] = useState(false);
  const [regeneratingModules, setRegeneratingModules] = useState(false);

  const profile = {
    target_language: 'Spanish',
    language_level: 'intermediate',
    days_streak: 7,
    motivation: 'travel',
    goal: 'reach B2 level'
  };

  
  const preferredLanguage = userProfile?.settings?.preferredLanguage || 'spanish';
  const capitalizedLanguage = preferredLanguage.charAt(0).toUpperCase() + preferredLanguage.slice(1);
  const userLevel = userProfile?.languages?.[preferredLanguage]?.proficiencyLevel || 'beginner';
  const capitalizedLevel = userLevel.charAt(0).toUpperCase() + userLevel.slice(1);

  const { modules: fetchedModules, loading, error } = useModulePlanner(profile);
  
  
  const modules = [...fetchedModules];
  if (modules.length < 6) {
    const additionalModules = [
      {
        id: 'practice-dialogue',
        title: 'Practice Dialogue',
        description: 'Practice common dialogue scenarios you will encounter in everyday situations',
        level: activeLevel,
        timeEstimate: '2 hours',
        progress: 0,
        isLocked: false
      },
      {
        id: 'language-games',
        title: 'Language Games',
        description: 'Fun interactive games to reinforce vocabulary and grammar concepts',
        level: activeLevel,
        timeEstimate: '1.5 hours',
        progress: 0,
        isLocked: false
      }
    ];
    
    for (let i = 0; modules.length < 6 && i < additionalModules.length; i++) {
      modules.push(additionalModules[i]);
    }
  }

  
  useEffect(() => {
    const saveModules = async () => {
      if (!user || loading || modules.length === 0 || savingModules) {
        return;
      }

      try {
        setSavingModules(true);
        const modulesExist = await checkModulesExist();
        
        if (!modulesExist) {
          notifications.show({
            id: 'saving-modules',
            title: 'Setting up modules',
            message: 'Creating modules for the first time...',
            loading: true,
            autoClose: false
          });
          
          await saveModulesToFirebase(modules);
          
          notifications.update({
            id: 'saving-modules',
            title: 'Modules ready',
            message: 'Your learning modules are now ready!',
            color: 'green',
            loading: false,
            autoClose: 3000
          });
        } else {
        }
      } catch (error) {

        notifications.update({
          id: 'saving-modules',
          title: 'Error',
          message: 'There was a problem setting up your modules',
          color: 'red',
          loading: false,
          autoClose: 5000
        });
      } finally {
        setSavingModules(false);
      }
    };

    saveModules();
  }, [user, modules, loading, savingModules]);

  
  const handleRegenerateModules = async () => {
    if (!user || !modules.length || regeneratingModules) {
      return;
    }

    try {
      setRegeneratingModules(true);

      notifications.show({
        id: 'regenerating-modules',
        title: 'Regenerating modules',
        message: 'Clearing existing modules and creating new ones...',
        loading: true,
        autoClose: false
      });

      
      await deleteAllModules();

      
      await saveModulesToFirebase(modules);

      notifications.update({
        id: 'regenerating-modules',
        title: 'Success',
        message: 'All modules have been regenerated!',
        color: 'green',
        loading: false,
        autoClose: 3000
      });
    } catch (error) {

      notifications.update({
        id: 'regenerating-modules',
        title: 'Error',
        message: 'Failed to regenerate modules',
        color: 'red',
        loading: false,
        autoClose: 5000
      });
    } finally {
      setRegeneratingModules(false);
    }
  };

  const filteredModules = modules.filter((mod) => {
    const moduleLevel = mod.level.toLowerCase();
    return moduleLevel.includes(activeLevel.toLowerCase());
  });

  useEffect(() => {
    if (!hasSpoken) {
      const timer = setTimeout(() => {
        setHasSpoken(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasSpoken]);

  const handleModuleClick = (moduleId: string) => {
    navigate(`/modules/${moduleId}`);
  };

  return (
    <AppShell header={{ height: 60 }} padding={0} style={{ backgroundColor: '#0f1012' }}>
      <Header selectedMode="tutor" onModeChange={() => { }} showSettings />

      <AppShell.Main style={{ position: 'relative', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
        <Container size="xl" py="xl">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Paper
              p="xl"
              radius="lg"
              style={{
                ...glassEffect,
                marginBottom: rem(40),
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  top: -60,
                  right: -60,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${accentBlue}30 0%, transparent 70%)`,
                  opacity: 0.6
                }}
              />
              
              <Group justify="space-between" align="center">
                <Stack gap="xs">
                  <Title order={3} style={{ color: 'white', fontSize: rem(22) }}>
                    {capitalizedLanguage} Learning Modules
                  </Title>
                  <Text size="sm" c="dimmed">
                    Structured lessons focused on different aspects of language learning
                  </Text>
                </Stack>
                
                <Group>
                  <Tooltip label="Regenerate all modules">
                    <ActionIcon 
                      variant="subtle" 
                      color="blue" 
                      size="lg" 
                      loading={regeneratingModules || loading}
                      onClick={handleRegenerateModules}
                    >
                      <IconRefresh size={20} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <Button
                    variant="light"
                    color="gray"
                    radius="xl"
                    leftSection={<IconBooks size={16} />}
                    style={{
                      backgroundColor: 'rgba(30, 31, 40, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {capitalizedLevel} Level
                  </Button>
                </Group>
              </Group>
            </Paper>
          </motion.div>

          <Group align="flex-start" gap="xl" wrap="nowrap">
            <Stack gap={rem(10)} w={120}>
              {learningLevels.map((lvl) => (
                <motion.div
                  key={lvl.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper
                    p="md"
                    style={{
                      ...glassEffect,
                      backgroundColor: activeLevel === lvl.id ? `${lvl.color}20` : 'transparent',
                      cursor: 'pointer',
                      borderLeft: activeLevel === lvl.id ? `4px solid ${lvl.color}` : '4px solid transparent'
                    }}
                    onClick={() => setActiveLevel(lvl.id)}
                  >
                    <Stack align="center" gap="xs">
                      <CustomThemeIcon 
                        color={lvl.color} 
                        variant={activeLevel === lvl.id ? 'filled' : 'light'}
                      >
                        <lvl.icon size={18} style={{ color: activeLevel === lvl.id ? 'white' : lvl.color }} />
                      </CustomThemeIcon>
                      <Text size="xs" c={activeLevel === lvl.id ? 'white' : 'dimmed'} fw={500}>
                        {lvl.label}
                      </Text>
                    </Stack>
                  </Paper>
                </motion.div>
              ))}
            </Stack>

            <Box style={{ flex: 1 }}>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                {loading ? (
                  <Text c="dimmed">Loading modules...</Text>
                ) : error ? (
                  <Text c="red">{error}</Text>
                ) : filteredModules.length === 0 ? (
                  <Text c="dimmed">No modules found for the {activeLevel} level. Try another level.</Text>
                ) : (
                  filteredModules.map((mod, i) => {
                    const levelColor = learningLevels.find(level => 
                      level.id.toLowerCase() === mod.level.toLowerCase()
                    )?.color || accentBlue;
                    
                    return (
                      <motion.div 
                        key={mod.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.1 }}
                      >
                        <ModuleCard 
                          module={mod} 
                          color={levelColor}
                          onClick={() => handleModuleClick(mod.id)}
                        />
                      </motion.div>
                    );
                  })
                )}
              </SimpleGrid>
            </Box>
          </Group>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};


const ModuleCard = ({ module, color, onClick }: { module: AIModule, color: string, onClick: () => void }) => {
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
      onClick={onClick}
    >
      {module.isLocked && (
        <IconLock 
          size={16} 
          color="gray" 
          style={{ position: 'absolute', top: 16, right: 16 }} 
        />
      )}
      
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
            width: rem(40),
            height: rem(40),
            borderRadius: '50%',
            backgroundColor: `${color}15`,
            border: `1px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}
        >
          <div style={{ 
            color: color, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            width: '100%'
          }}>
            {getModuleIcon(module, color)}
          </div>
        </Center>
        <Box ml={8}>
          <Text fw={600} size="lg" style={{ fontSize: '20px', lineHeight: 1.2, marginBottom: '4px' }}>
            {module.title}
          </Text>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.3 }}>
            {module.description}
          </Text>
        </Box>
      </Group>

      <Box style={{ marginTop: 'auto', paddingTop: rem(20) }}>
        <Group gap="xs" mb={rem(10)}>
          <IconClockHour4 size={14} color="gray" />
          <Text size="xs" c="gray.5">{module.timeEstimate}</Text>
        </Group>

        <Progress
          value={module.progress}
          color={color.replace('#', '')}
          size="md"
          radius="xl"
          style={{ marginBottom: rem(16) }}
        />

        <Group justify="space-between">
          <Group gap="xs" align="center">
            <IconTrophy size={16} color={color} />
            <Text fw={600} size="md">{Math.floor(module.progress * 10)} XP</Text>
          </Group>

          {!module.isLocked && (
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
          )}
        </Group>
      </Box>
    </Paper>
  )
};

export default ModulesPage;
