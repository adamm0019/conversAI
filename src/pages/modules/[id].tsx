import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppShell,
  Container,
  Paper,
  Group,
  Box,
  Text,
  Title,
  Stack,
  Progress,
  Button,
  rem,
  Center,
  Stepper,
  Avatar,
  RingProgress,
  Loader,
  ActionIcon,
  Transition
} from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { Header } from '../../components/Header/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { useModulePlanner, AIModule } from '../../hooks/useModulePlanner';
import {
  IconArrowLeft,
  IconArrowRight,
  IconMicrophone,
  IconCheck,
  IconPlayerPlay,
  IconStar,
  IconTrophy,
  IconVocabulary,
  IconBooks,
  IconMessageChatbot,
  IconBrain,
  IconSchool,
  IconEar
} from '@tabler/icons-react';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, increment, Timestamp, FieldValue } from 'firebase/firestore';
import { db } from '../../lib/firebase/firebaseConfig';
import { notifications } from '@mantine/notifications';
import { getOpenAIApiKey, OPENAI_CONFIG } from '../../config/apiConfig';
import { playTextToSpeech } from '../../services/AudioService';

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

const pulseAnimation = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.05)' },
  '100%': { transform: 'scale(1)' }
});

interface ModuleStep {
  id: string;
  instruction: string;
  phrase: string;
  translation?: string;
  skillType: 'pronunciation' | 'vocabulary' | 'grammar' | 'comprehension' | 'listening';
  completed?: boolean;
  userResponse?: string;
  feedback?: string;
}

const getSkillTypeIcon = (skillType: string) => {
  switch (skillType) {
    case 'pronunciation':
      return <IconMicrophone size={18} />;
    case 'vocabulary':
      return <IconVocabulary size={18} />;
    case 'grammar':
      return <IconBooks size={18} />;
    case 'comprehension':
      return <IconBrain size={18} />;
    case 'listening':
      return <IconEar size={18} />;
    default:
      return <IconSchool size={18} />;
  }
};

const getSkillTypeColor = (skillType: string) => {
  switch (skillType) {
    case 'pronunciation':
      return accentBlue;
    case 'vocabulary':
      return accentGreen;
    case 'grammar':
      return accentPurple;
    case 'comprehension':
      return accentOrange;
    case 'listening':
      return accentYellow;
    default:
      return accentBlue;
  }
};

const generateModuleSteps = async (moduleData: AIModule, language: string, level: string, userId: string) => {
  try {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    
    const prompt = `
      Create 5 learning steps for a language module with the following details:
      - Title: ${moduleData.title}
      - Target language: ${language}
      - User's proficiency level: ${level}
      
      For each step, include:
      1. An instruction to guide the learner
      2. A phrase in ${language} to practice
      3. A translation of the phrase in English
      4. A skill type (pronunciation, vocabulary, grammar, comprehension, or listening)
      
      Return the response as a JSON object with a 'steps' array containing objects with these properties:
      {
        "steps": [
          {
            "instruction": "string",
            "phrase": "string",
            "translation": "string",
            "skillType": "pronunciation|vocabulary|grammar|comprehension|listening"
          }
        ]
      }
    `;
    
    
    const response = await fetch(OPENAI_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert language tutor specializing in ${language} education. 
            You create personalized learning content for ${language} learners at the ${level} level.
            You always respond with valid JSON that can be parsed by JSON.parse().`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    const parsedData = JSON.parse(content);
    
    if (!parsedData.steps || !Array.isArray(parsedData.steps) || parsedData.steps.length === 0) {
      throw new Error('Invalid steps data in OpenAI response');
    }
    
    return parsedData.steps;
  } catch (err) {

    throw err;
  }
};

const ModulePlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, updateLanguageProgress } = useUserProfile();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [module, setModule] = useState<AIModule | null>(null);
  const [steps, setSteps] = useState<ModuleStep[]>([]);
  const [currentXP, setCurrentXP] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const preferredLanguage = userProfile?.settings?.preferredLanguage || 'spanish';
  const languageLevel = userProfile?.languages?.[preferredLanguage]?.proficiencyLevel || 'beginner';

  useEffect(() => {
    if (!user || !id) return;

    const fetchModule = async () => {
      try {
        setLoading(true);
        
        
        const moduleRef = doc(db, 'modules', id);
        
        const moduleSnapshot = await getDoc(moduleRef);
        
        if (!moduleSnapshot.exists()) {
          
          if (id.includes('fallback')) {
            
            const fallbackModule = {
              id: id,
              title: id.includes('1') ? "Basic Conversations" : "Essential Vocabulary",
              description: id.includes('1') ? "Practice everyday conversations" : "Learn the most important words",
              level: languageLevel,
              timeEstimate: "15-20 minutes",
              createdAt: Timestamp.now(),
              progress: 0
            };
            
            await setDoc(moduleRef, fallbackModule);
            setModule(fallbackModule as AIModule);
            
            
            await generateModuleStepsAndSave(fallbackModule as AIModule);
            setLoading(false);
            return;
          }
          
          throw new Error('Module not found');
        }
        
        const moduleData = moduleSnapshot.data() as AIModule;
        
        setModule(moduleData);
        
        
        const stepsRef = collection(db, `user_profiles/${user.uid}/modules/${id}/steps`);
        const stepsSnapshot = await getDocs(stepsRef);
        
        if (!stepsSnapshot.empty) {
          
          const stepsData = stepsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ModuleStep[];
          
          
          stepsData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
          setSteps(stepsData);
          
        } else {
          
          
          await generateModuleStepsAndSave(moduleData);
        }
        
        
        const progressRef = doc(db, `user_profiles/${user.uid}/progress/modules`);
        const progressSnapshot = await getDoc(progressRef);
        
        if (progressSnapshot.exists()) {
          const progressData = progressSnapshot.data();
          setCurrentXP(progressData[id]?.xp || 0);
        }
        
        setLoading(false);
      } catch (err) {

        setError(err instanceof Error ? err.message : 'Failed to load module');
        setLoading(false);
      }
    };
    
    fetchModule();
  }, [user, id]);

  const generateModuleStepsAndSave = async (moduleData: AIModule) => {
    if (!user || !userProfile || !id) return;
    
    try {
      setGenerating(true);
      notifications.show({
        id: 'generating-content',
        title: 'Generating content',
        message: 'Creating personalized learning steps...',
        loading: true,
        autoClose: false
      });
      
      
      const generatedSteps = await generateModuleSteps(
        moduleData, 
        preferredLanguage, 
        languageLevel, 
        user.uid
      );
      
      
      const batch = await Promise.all(generatedSteps.map(async (step: ModuleStep, index: number) => {
        const stepRef = doc(db, `user_profiles/${user.uid}/modules/${id}/steps`, index.toString());
        const stepData = {
          ...step,
          id: index.toString(),
          completed: false,
          createdAt: Timestamp.now()
        };
        
        await setDoc(stepRef, stepData);
        return stepData;
      }));
      
      setSteps(batch);
      notifications.update({
        id: 'generating-content',
        title: 'Content ready',
        message: 'Your personalized learning steps are ready',
        color: 'green',
        loading: false,
        autoClose: 3000
      });
      
      setGenerating(false);
    } catch (err) {

      notifications.update({
        id: 'generating-content',
        title: 'Error',
        message: 'Failed to generate content. Using default steps instead.',
        color: 'red',
        loading: false,
        autoClose: 5000
      });
      
      setError(err instanceof Error ? err.message : 'Failed to generate module steps');
      setGenerating(false);
      
      
      const fallbackSteps: ModuleStep[] = [
        {
          id: '0',
          instruction: 'Listen and repeat the following phrase',
          phrase: 'Hello, how are you?',
          translation: 'Hola, ¿cómo estás?',
          skillType: 'pronunciation',
          completed: false
        },
        {
          id: '1',
          instruction: 'Practice this vocabulary',
          phrase: 'I would like to order food',
          translation: 'Me gustaría ordenar comida',
          skillType: 'vocabulary',
          completed: false
        },
        {
          id: '2',
          instruction: 'Construct a sentence with the correct grammar',
          phrase: 'Yesterday I went to the museum',
          translation: 'Ayer fui al museo',
          skillType: 'grammar',
          completed: false
        },
        {
          id: '3',
          instruction: 'Listen and comprehend the meaning',
          phrase: 'Can you help me find the train station?',
          translation: '¿Puedes ayudarme a encontrar la estación de tren?',
          skillType: 'comprehension',
          completed: false
        }
      ];
      
      
      await Promise.all(fallbackSteps.map(async (step) => {
        const stepRef = doc(db, `user_profiles/${user.uid}/modules/${id}/steps`, step.id);
        await setDoc(stepRef, {
          ...step,
          createdAt: Timestamp.now()
        });
      }));
      
      setSteps(fallbackSteps);
    }
  };

  const handleComplete = async () => {
    if (!user || !module) return;
    
    try {
      
      const stepsCompleted = steps.filter(step => step.completed).length;
      const totalSteps = steps.length;
      const completionPercentage = (stepsCompleted / totalSteps) * 100;
      
      
      const baseXP = 10 * stepsCompleted;
      const completionBonus = completionPercentage >= 80 ? 20 : 0;
      const totalXP = baseXP + completionBonus;
      
      setXpGained(totalXP);
      
      
      const progressRef = doc(db, `user_profiles/${user.uid}/progress/modules`);
      const progressSnapshot = await getDoc(progressRef);
      
      if (progressSnapshot.exists()) {
        await updateDoc(progressRef, {
          [`${id}.xp`]: increment(totalXP),
          [`${id}.completedAt`]: Timestamp.now(),
          [`${id}.completionPercentage`]: completionPercentage
        });
      } else {
        await setDoc(progressRef, {
          [id as string]: {
            xp: totalXP,
            completedAt: Timestamp.now(),
            completionPercentage: completionPercentage
          }
        });
      }
      
      
      if (userProfile?.languages?.[preferredLanguage]) {
        await updateLanguageProgress(preferredLanguage, {
          experiencePoints: userProfile.languages[preferredLanguage].experiencePoints + totalXP,
          lessonsCompleted: increment(1) as any
        });
      }
      
      setCompleted(true);
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to complete module');
    }
  };

  const handleStepComplete = async (stepIndex: number) => {
    if (!user || !module || stepIndex >= steps.length) return;
    
    try {
      
      const updatedSteps = [...steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        completed: true
      };
      
      
      const stepRef = doc(db, `user_profiles/${user.uid}/modules/${id}/steps`, stepIndex.toString());
      await updateDoc(stepRef, {
        completed: true,
        completedAt: Timestamp.now()
      });
      
      setSteps(updatedSteps);
      
      
      const feedbackMessages = [
        'Great job!', 
        'Well done!', 
        'Excellent!',
        'You\'re making progress!',
        'Keep it up!'
      ];
      
      setStepFeedback(feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]);
      setShowFeedback(true);
      
      
      setTimeout(() => {
        setShowFeedback(false);
        
        
        if (stepIndex < steps.length - 1) {
          setTimeout(() => {
            setActiveStep(stepIndex + 1);
          }, 500);
        } else {
          
          setTimeout(() => {
            handleComplete();
          }, 500);
        }
      }, 2000);
    } catch (err) {

    }
  };

  if (loading) {
    return (
      <AppShell header={{ height: 60 }} padding={0} style={{ backgroundColor: darkBg }}>
        <Header selectedMode="tutor" onModeChange={() => {}} showSettings />
        <AppShell.Main style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <Center style={{ height: '100%' }}>
            <Stack align="center" gap="md">
              <Loader size="xl" color={accentBlue} />
              <Text size="lg" c="dimmed">Loading module...</Text>
            </Stack>
          </Center>
        </AppShell.Main>
      </AppShell>
    );
  }

  if (generating) {
    return (
      <AppShell header={{ height: 60 }} padding={0} style={{ backgroundColor: darkBg }}>
        <Header selectedMode="tutor" onModeChange={() => {}} showSettings />
        <AppShell.Main style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <Center style={{ height: '100%' }}>
            <Stack align="center" gap="md">
              <Loader size="xl" color={accentBlue} />
              <Text size="lg" c="dimmed">Generating personalized content...</Text>
              <Text size="md" c="dimmed" mt="xs">This may take a few moments</Text>
            </Stack>
          </Center>
        </AppShell.Main>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell header={{ height: 60 }} padding={0} style={{ backgroundColor: darkBg }}>
        <Header selectedMode="tutor" onModeChange={() => {}} showSettings />
        <AppShell.Main style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <Container size="md" py="xl">
            <Paper p="xl" radius="lg" style={glassEffect}>
              <Stack align="center">
                <Title order={3} c="red">Error Loading Module</Title>
                <Text c="dimmed">{error}</Text>
                <Button 
                  mt="md" 
                  variant="light" 
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => navigate('/modules')}
                >
                  Back to Modules
                </Button>
              </Stack>
            </Paper>
          </Container>
        </AppShell.Main>
      </AppShell>
    );
  }

  if (completed) {
    return (
      <AppShell header={{ height: 60 }} padding={0} style={{ backgroundColor: darkBg }}>
        <Header selectedMode="tutor" onModeChange={() => {}} showSettings />
        <AppShell.Main style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <Container size="md" py="xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper p="xl" radius="lg" style={glassEffect}>
                <Stack align="center" gap="xl">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <RingProgress
                      size={160}
                      thickness={16}
                      roundCaps
                      sections={[{ value: 100, color: accentGreen }]}
                      label={
                        <Center>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }}
                          >
                            <IconCheck size={60} color={accentGreen} />
                          </motion.div>
                        </Center>
                      }
                    />
                  </motion.div>

                  <Title order={2} ta="center">Module Completed!</Title>
                  <Text size="lg" c="dimmed" ta="center">
                    You've successfully completed the "{module?.title}" module.
                  </Text>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Paper 
                      p="lg" 
                      radius="md" 
                      style={{ 
                        background: 'rgba(20, 20, 30, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <Group justify="space-between">
                        <Group>
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 1, repeat: 2 }}
                          >
                            <IconTrophy size={40} color={accentYellow} />
                          </motion.div>
                          <Stack gap={0}>
                            <Text size="sm" c="dimmed">You earned</Text>
                            <Text size="xl" fw={700}>{xpGained} XP</Text>
                          </Stack>
                        </Group>

                        <RingProgress
                          size={80}
                          thickness={8}
                          roundCaps
                          sections={[{ value: 100, color: accentYellow }]}
                          label={
                            <Center>
                              <IconStar size={24} color={accentYellow} />
                            </Center>
                          }
                        />
                      </Group>
                    </Paper>
                  </motion.div>

                  <Group>
                    <Button
                      variant="light"
                      leftSection={<IconArrowLeft size={16} />}
                      onClick={() => navigate('/modules')}
                    >
                      Back to Modules
                    </Button>
                    <Button
                      variant="filled"
                      color="blue"
                      onClick={() => {
                        setCompleted(false);
                        setActiveStep(0);
                      }}
                    >
                      Practice Again
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            </motion.div>
          </Container>
        </AppShell.Main>
      </AppShell>
    );
  }

  return (
    <AppShell header={{ height: 60 }} padding={0} style={{ backgroundColor: darkBg }}>
      <Header selectedMode="tutor" onModeChange={() => {}} showSettings />
      <AppShell.Main style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
        <Container size="xl" py="xl">
          <Paper 
            p="lg" 
            radius="lg" 
            mb="xl" 
            style={{
              ...glassEffect,
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}
          >
            <Group justify="space-between">
              <Group>
                <ActionIcon 
                  variant="light" 
                  radius="xl" 
                  color="blue" 
                  size="lg"
                  onClick={() => navigate('/modules')}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
                <Title order={3}>{module?.title}</Title>
              </Group>
              
              <Progress
                value={(activeStep / (steps.length - 1)) * 100}
                size="sm"
                color="blue"
                radius="xl"
                style={{ width: '200px' }}
              />
            </Group>
          </Paper>

          <Box>
            <AnimatePresence mode="wait">
              {steps.length > 0 && (
                <motion.div
                  key={`step-${activeStep}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper p="xl" radius="lg" style={glassEffect}>
                    <Stack gap="xl">
                      <Group>
                        <Avatar 
                          radius="xl" 
                          size="lg" 
                          color={getSkillTypeColor(steps[activeStep].skillType).replace('#', '')}
                          style={{ 
                            backgroundColor: `${getSkillTypeColor(steps[activeStep].skillType)}20`,
                            color: getSkillTypeColor(steps[activeStep].skillType)
                          }}
                        >
                          {getSkillTypeIcon(steps[activeStep].skillType)}
                        </Avatar>
                        <Box>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                            {steps[activeStep].skillType}
                          </Text>
                          <Text fw={600} size="lg">
                            {steps[activeStep].instruction}
                          </Text>
                        </Box>
                      </Group>

                      <Paper
                        p="lg"
                        radius="md"
                        style={{
                          background: 'rgba(25, 25, 35, 0.5)',
                          borderLeft: `4px solid ${getSkillTypeColor(steps[activeStep].skillType)}`
                        }}
                      >
                        <Stack>
                          <Text size="xl" fw={600} style={{ fontSize: '24px' }}>
                            {steps[activeStep].phrase}
                          </Text>
                          {steps[activeStep].translation && (
                            <Text size="md" c="dimmed">
                              {steps[activeStep].translation}
                            </Text>
                          )}
                        </Stack>
                      </Paper>

                      <Group justify="space-between">
                        <Button
                          variant="subtle"
                          leftSection={<IconPlayerPlay size={16} />}
                          onClick={() => {
                            playTextToSpeech(steps[activeStep].phrase, preferredLanguage);
                          }}
                        >
                          Listen
                        </Button>
                        
                        <Button
                          variant={steps[activeStep].completed ? "light" : "filled"}
                          color={steps[activeStep].completed ? "green" : "blue"}
                          radius="md"
                          size="md"
                          rightSection={steps[activeStep].completed ? <IconCheck size={16} /> : <IconMicrophone size={16} />}
                          onClick={() => handleStepComplete(activeStep)}
                          disabled={steps[activeStep].completed}
                        >
                          {steps[activeStep].completed ? "Completed" : "Mark as Complete"}
                        </Button>
                      </Group>
                      
                      <Transition mounted={showFeedback} transition="fade" duration={400}>
                        {(styles) => (
                          <Paper
                            p="md"
                            radius="md"
                            style={{
                              ...styles,
                              backgroundColor: `${accentGreen}20`,
                              borderLeft: `4px solid ${accentGreen}`
                            }}
                          >
                            <Group>
                              <IconCheck size={20} color={accentGreen} />
                              <Text fw={600} color={accentGreen}>
                                {stepFeedback}
                              </Text>
                            </Group>
                          </Paper>
                        )}
                      </Transition>
                    </Stack>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            <Paper
              p="lg"
              radius="lg"
              mt="lg"
              style={glassEffect}
            >
              <Stepper active={activeStep} color="blue" size="sm">
                {steps.map((step, index) => (
                  <Stepper.Step
                    key={step.id}
                    label=""
                    completedIcon={<IconCheck size={14} />}
                    onClick={() => setActiveStep(index)}
                    color={step.completed ? "green" : "blue"}
                  />
                ))}
              </Stepper>
              
              <Group justify="space-between" mt="md">
                <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                >
                  Previous
                </Button>
                
                <Group>
                  <Button
                    variant="light"
                    color="blue"
                    onClick={() => navigate('/modules')}
                  >
                    Save & Exit
                  </Button>
                  
                  {activeStep < steps.length - 1 ? (
                    <Button
                      variant="filled"
                      color="blue"
                      rightSection={<IconArrowRight size={16} />}
                      onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                      disabled={activeStep === steps.length - 1}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="filled"
                      color="green"
                      rightSection={<IconCheck size={16} />}
                      onClick={handleComplete}
                      disabled={!steps.every(step => step.completed)}
                    >
                      Complete Module
                    </Button>
                  )}
                </Group>
              </Group>
            </Paper>
          </Box>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default ModulePlayer; 