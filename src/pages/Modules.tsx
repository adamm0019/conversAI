import React, { useState, useEffect, useRef } from 'react';
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
  SimpleGrid,
  List
} from '@mantine/core';
import axios from 'axios';
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
  IconArrowRightCircle,
  IconBookUpload,
  IconVocabulary,
  IconMessageChatbot,
  IconClockHour4,
  IconClock
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/Header/Header';
import { AudioVisualiser } from '../components/AudioControls/AudioVisualiser';

// Learning path levels
const learningLevels = [
  { id: 'beginner', label: 'Beginner', icon: IconBrain },
  { id: 'intermediate', label: 'Intermediate', icon: IconBooks },
  { id: 'immersion', label: 'Immersion', icon: IconMountain },
  { id: 'foundation', label: 'Foundation', icon: IconTimeline }
];

// Module definition
interface Module {
  id: string;
  title: string;
  description: string;
  progress: number;
  isLocked?: boolean;
  timeEstimate: string;
  level: string;
}

// Speak text using ElevenLabs
const speakText = async (text: string) => {
  try {
    // Use ElevenLabs API to generate speech
    const response = await axios.post('/api/tts', { 
      text,
      voice_id: 'EXAVITQu4vr4xnSDxMaL', // Default voice ID
      model_id: 'eleven_monolingual_v1'
    }, {
      responseType: 'arraybuffer'
    });

    // Create an audio element and play the speech
    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Play the audio
    await audio.play();
    
    // Clean up URL object after audio is done playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  } catch (error) {
    console.error('Error generating speech:', error);
    
    // Fallback to browser's built-in speech synthesis if ElevenLabs fails
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES'; // Spanish
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }
};

const ModulesPage = () => {
  const theme = useMantineTheme();
  const [activeLevel, setActiveLevel] = useState('intermediate');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSpoken, setHasSpoken] = useState(false);

  // Sample modules
  const modules: Module[] = [
    {
      id: 'vocab-builder',
      title: 'Vocabulary Builder',
      description: 'Expand your word bank with targeted practice',
      progress: 60,
      timeEstimate: '15-mins',
      level: 'intermediate'
    },
    {
      id: 'everyday-conversations',
      title: 'Everyday Conversations',
      description: 'Practice common dialogues for daily interactions',
      progress: 80,
      timeEstimate: '15-20 min',
      level: 'intermediate'
    },
    {
      id: 'complex-sentences',
      title: 'Complex Sentences',
      description: 'Master advanced sentence structures and expressions',
      progress: 0,
      isLocked: true,
      timeEstimate: '25-30 min',
      level: 'intermediate'
    },
    {
      id: 'vocabulary-drills',
      title: 'Vocabulary Drills',
      description: 'Quick practice sessions to strengthen your vocabulary',
      progress: 40,
      timeEstimate: '10 mins',
      level: 'beginner'
    },
    {
      id: 'grammar-basics',
      title: 'Grammar Basics',
      description: 'Master essential grammar patterns and rules',
      progress: 70,
      timeEstimate: '20 mins',
      level: 'beginner'
    }
  ];

  const filteredModules = modules.filter(module => module.level === activeLevel);
  
  const handleModeChange = (mode: string) => {
    console.log('Mode changed:', mode);
  };

  // AI suggestions
  const aiSuggestions = [
    'Finish "Complex Sentences" - 20% left',
    'Try "Story Retelling" to boost grammar',
    'Grammar gap: Verb conjugestion - try this→'
  ];

  // Use ElevenLabs to speak the greeting when the page loads
  useEffect(() => {
    if (!hasSpoken) {
      // Short delay to ensure the page has loaded properly
      const timer = setTimeout(() => {
        const greeting = '¡Hola, Alex! Ready to push your Spanish speaking to B2?';
        speakText(greeting);
        setHasSpoken(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasSpoken]);

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
        showSettings={true}
      />

      <AppShell.Main style={{
        backgroundColor: '#0f1012',
        backgroundImage: 'radial-gradient(circle at top right, rgba(37, 38, 43, 0.2) 0%, transparent 70%)'
      }}>
        <Box py="xl" h="calc(100vh - 60px)" pos="relative" style={{ overflowY: 'auto' }}>
          {/* Decorative background elements */}
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

          <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
            {/* Glass Card Header with Waveform */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper
                p="xl"
                radius="lg"
                mb={40}
                style={{
                  background: 'rgba(25, 27, 32, 0.7)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  overflow: 'hidden',
                  position: 'relative',
                  height: 160
                }}
              >
                <Group align="center" justify="space-between" h="100%">
                  <Group gap={24}>
                    <Box style={{ 
                      width: 120, 
                      height: 35,
                      position: 'relative',
                      marginTop: '10px',
                      overflow: 'visible'
                    }}>
                      <canvas 
                        ref={canvasRef} 
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          opacity: 0.8,
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }}
                      />
                      <AudioVisualiser 
                        canvasRef={canvasRef} 
                        isActive={true}
                        visualizerStyle="wave"
                        color="#4195d3"
                      />
                    </Box>
                    <Box>
                      <Text size="xl" fw={600} c="white" style={{ lineHeight: 1.4 }}>
                        ¡Hola, Alex! Ready to push your Spanish speaking to B2?
                      </Text>
                    </Box>
                  </Group>
                  <Box style={{ position: 'relative', width: 100, height: 100 }}>
                    <Text fw={800} c="blue.4" ta="center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2rem' }}>
                      78%
                    </Text>
                    <RingProgress
                      size={100}
                      thickness={4}
                      roundCaps
                      sections={[{ value: 78, color: 'blue.4' }]}
                      label={<></>}
                    />
                    <Text size="xs" c="dimmed" ta="center" mt={5}>Next Milestone</Text>
                  </Box>
                </Group>
              </Paper>
            </motion.div>

            {/* Main content area with learning paths and modules */}
            <Group align="flex-start" style={{ gap: '2rem' }} wrap="nowrap">
              {/* Left side: Learning Path Tree */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Paper
                  radius="lg"
                  p={0}
                  style={{
                    background: 'rgba(25, 27, 32, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    width: rem(120),
                    minHeight: rem(500)
                  }}
                >
                  <Stack gap={0}>
                    {learningLevels.map((level) => (
                      <Box 
                        key={level.id}
                        style={{ 
                          position: 'relative',
                          padding: rem(15),
                          paddingTop: rem(25),
                          paddingBottom: rem(25),
                          backgroundColor: activeLevel === level.id ? 'rgba(50, 85, 155, 0.2)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => setActiveLevel(level.id)}
                      >
                        {/* Vertical line connector */}
                        {level.id !== 'foundation' && (
                          <Box style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: '-30px',
                            width: '2px',
                            height: '60px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            zIndex: 0
                          }} />
                        )}
                        
                        {/* Active indicator dot */}
                        {activeLevel === level.id && (
                          <Box
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: '4px',
                              height: '100%',
                              background: 'var(--mantine-color-blue-6)',
                            }}
                          />
                        )}
                        
                        <Stack align="center" gap="sm">
                          <ThemeIcon 
                            size="md"
                            radius="xl"
                            variant={activeLevel === level.id ? "filled" : "light"}
                            color={activeLevel === level.id ? "blue" : "gray"}
                          >
                            <level.icon size={18} />
                          </ThemeIcon>
                          <Text 
                            size="sm" 
                            fw={500}
                            c={activeLevel === level.id ? "white" : "dimmed"}
                          >
                            {level.label}
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </motion.div>

              {/* Right side: Modules Grid */}
              <Box style={{ flex: 1 }}>
                <SimpleGrid cols={3} spacing="lg">
                  {/* Render filtered modules */}
                  {filteredModules.map((module, index) => (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Paper
                        p="md"
                        radius="md"
                        style={{
                          background: 'rgba(25, 27, 32, 0.7)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          cursor: module.isLocked ? 'default' : 'pointer',
                          opacity: module.isLocked ? 0.7 : 1,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {module.isLocked && (
                          <Box 
                            style={{ 
                              position: 'absolute', 
                              top: 10, 
                              right: 10,
                              zIndex: 2
                            }}
                          >
                            <IconLock size={18} color="var(--mantine-color-gray-6)" />
                          </Box>
                        )}
                        
                        {/* Module icon */}
                        <ThemeIcon 
                          size="md" 
                          radius="md" 
                          variant="filled" 
                          color={module.id.includes('vocab') ? "blue" : 
                                 module.id.includes('conversation') ? "blue" : 
                                 "blue"} 
                          mb="md"
                          style={{ opacity: 0.8 }}
                        >
                          {module.id.includes('vocab') ? (
                            <IconVocabulary size={16} />
                          ) : module.id.includes('conversation') ? (
                            <IconMessageChatbot size={16} />
                          ) : (
                            <IconBooks size={16} />
                          )}
                        </ThemeIcon>
                        
                        <Title order={4} mb="xs" style={{ fontSize: '1.1rem' }}>{module.title}</Title>
                        <Text size="sm" c="dimmed" mb={25} lh={1.5}>
                          {module.description}
                        </Text>
                        
                        <Group gap="xs" mb="sm">
                          <Box style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(50, 50, 60, 0.5)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            <IconClockHour4 size={14} color="var(--mantine-color-gray-5)" />
                            <Text size="xs" c="gray.5">{module.timeEstimate}</Text>
                          </Box>
                        </Group>
                        
                        <Box mt="auto">
                          <Box mb="xs">
                            <Text size="sm" fw={500} c="gray.4" style={{ textAlign: 'right' }}>
                              {module.progress}%
                            </Text>
                          </Box>
                          <Progress
                            value={module.progress}
                            color={module.isLocked ? "gray" : "blue"}
                            size="sm"
                            radius="xl"
                            mb="md"
                            styles={{
                              root: {
                                backgroundColor: 'rgba(40, 45, 55, 0.5)'
                              }
                            }}
                          />
                          
                          {module.progress > 0 && !module.isLocked && (
                            <Button 
                              variant="filled" 
                              color="blue" 
                              radius="md" 
                              fullWidth
                              styles={{
                                root: {
                                  backgroundColor: 'rgba(50, 115, 220, 0.8)'
                                }
                              }}
                            >
                              Resume
                            </Button>
                          )}
                          
                          {module.isLocked && (
                            <Text size="sm" c="dimmed" ta="center">
                              Locked
                            </Text>
                          )}
                        </Box>
                      </Paper>
                    </motion.div>
                  ))}
                  
                  {/* AI Suggests Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <Paper
                      p="md"
                      radius="md"
                      style={{
                        background: 'rgba(25, 27, 32, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Title order={4} mb={25} style={{ fontSize: '1.1rem' }}>AI Suggests</Title>
                      
                      <List spacing="xl" style={{ listStyleType: 'none' }}>
                        {aiSuggestions.map((suggestion, index) => (
                          <List.Item
                            key={index}
                            icon={
                              <Box
                                style={{
                                  width: 6,
                                  height: 6,
                                  backgroundColor: 'var(--mantine-color-blue-5)',
                                  borderRadius: '50%',
                                  marginTop: 8
                                }}
                              />
                            }
                          >
                            <Text size="sm" lh={1.5}>{suggestion}</Text>
                          </List.Item>
                        ))}
                      </List>
                    </Paper>
                  </motion.div>
                </SimpleGrid>
              </Box>
            </Group>
          </Container>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export default ModulesPage;