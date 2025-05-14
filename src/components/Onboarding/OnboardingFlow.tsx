import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  Select,
  Radio,
  Group,
  Slider,
  Switch,
  Stepper,
  Container,
  Title,
  Center,
  Loader,
  Paper,
  Stack,
  rem,
  ThemeIcon,
  Divider,
  Flex
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useUserProfile, ProficiencyLevel, UserProfile } from '../../contexts/UserProfileContext';
import { motion } from 'framer-motion';
import { 
  IconSchool, 
  IconLanguage, 
  IconStar, 
  IconClock, 
  IconRobot,
  IconCheck,
  IconChevronRight
} from '@tabler/icons-react';


const darkBg = '#141417';
const accentBlue = '#4195d3';
const accentPurple = '#8366d1';
const accentGreen = '#43c59e';
const accentOrange = '#e6854a';

const glassEffect = {
  background: 'rgba(30, 31, 40, 0.7)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.3s ease',
  borderRadius: rem(16),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
};

const glassmorphicButton = {
  background: 'rgba(28, 29, 34, 0.7)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(39, 40, 46, 0.8)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  height: '42px',
  padding: '0 24px',
  transition: 'all 0.2s ease'
};

interface OnboardingData extends Partial<UserProfile> {
  isOnboarded?: boolean;
  userPreferences?: {
    motivation?: string;
    feedbackStyle?: string;
  };
}

const motivations = [
  'Travel',
  'Career',
  'School',
  'Just for fun',
];

const languages = ['Spanish', 'French', 'Japanese', 'German', 'Italian'];
const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced'];
const feedbackStyles = ['Encouraging', 'Direct', 'Conversational'];

const StepSeparator = ({ active }: { active: boolean }) => (
  <Box
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 4px'
    }}
  >
    <IconChevronRight
      size={16}
      style={{
        opacity: active ? 0.9 : 0.3,
        color: active ? '#fff' : 'rgba(255, 255, 255, 0.5)'
      }}
    />
  </Box>
);

export const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { updateUserProfile, isLoading } = useUserProfile(); 
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [motivation, setMotivation] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [level, setLevel] = useState('Beginner');
  const [dailyGoal, setDailyGoal] = useState(15);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [feedbackStyle, setFeedbackStyle] = useState('Encouraging');

  const handleNext = async () => {
    if (activeStep < 4) {
      setActiveStep((current) => current + 1);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updateData: OnboardingData = {
        settings: {
          preferredLanguage: language.toLowerCase(),
          dailyGoal: dailyGoal,
          notifications: notificationsEnabled
        },
        languages: {
          [language.toLowerCase()]: {
            proficiencyLevel: level.toLowerCase() as ProficiencyLevel,
            experiencePoints: 0,
            wordsLearned: 0,
            lessonsCompleted: 0,
            lastActiveDate: new Date().toISOString().split('T')[0]
          }
        },
        userPreferences: {
          motivation: motivation,
          feedbackStyle: feedbackStyle,
        },
        isOnboarded: true
      };
      
      await updateUserProfile(updateData);
      localStorage.setItem('isOnboarded', 'true');
      navigate('/dashboard');
    } catch (error) {

    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Center style={{ 
        height: '100vh',
        backgroundColor: darkBg,
        backgroundImage: 'radial-gradient(circle at top right, rgba(80, 100, 240, 0.08) 0%, transparent 80%)'
      }}>
        <Loader size="xl" color={accentBlue} />
      </Center>
    );
  }

  return (
    <Box style={{
      minHeight: '100vh',
      backgroundColor: darkBg,
      backgroundImage: 'radial-gradient(circle at top right, rgba(80, 100, 240, 0.08) 0%, transparent 80%)',
      paddingTop: rem(40),
      paddingBottom: rem(40)
    }}>
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            p="xl"
            radius="lg"
            mb={rem(30)}
            style={{
              ...glassEffect,
              position: 'relative',
              overflow: 'hidden'
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

            <Box style={{ position: 'relative', zIndex: 1 }}>
              <Title order={2} ta="center" mb={rem(8)} fw={700} style={{ fontSize: rem(28) }}>
                Welcome to ConversAI
              </Title>
              <Text ta="center" c="dimmed" mb={rem(30)}>Let's set up your language learning experience</Text>
              
              <Flex justify="center" align="center" mb={rem(40)}>
                {[0, 1, 2, 3, 4].map((step) => (
                  <React.Fragment key={step}>
                    <Box 
                      onClick={() => step <= activeStep && setActiveStep(step)}
                      style={{ 
                        cursor: step <= activeStep ? 'pointer' : 'default',
                        opacity: step <= activeStep ? 1 : 0.5,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Flex direction="column" align="center" gap={rem(8)}>
                        <ThemeIcon 
                          size={42} 
                          radius="xl" 
                          variant={step <= activeStep ? "filled" : "light"}
                          color={
                            step === 0 ? accentBlue.replace('#', '') : 
                            step === 1 ? accentPurple.replace('#', '') : 
                            step === 2 ? accentGreen.replace('#', '') : 
                            step === 3 ? accentOrange.replace('#', '') : 
                            accentBlue.replace('#', '')
                          }
                          style={{
                            backgroundColor: step <= activeStep ? 
                              (step === 0 ? accentBlue : 
                               step === 1 ? accentPurple : 
                               step === 2 ? accentGreen : 
                               step === 3 ? accentOrange : 
                               accentBlue) : 
                              `rgba(${step === 0 ? '65, 149, 211' : 
                                      step === 1 ? '131, 102, 209' : 
                                      step === 2 ? '67, 197, 158' : 
                                      step === 3 ? '230, 133, 74' : 
                                      '65, 149, 211'}, 0.1)`,
                            border: step <= activeStep ? 
                              'none' : 
                              `1px solid rgba(255, 255, 255, 0.1)`
                          }}
                        >
                          {step < activeStep ? (
                            <IconCheck size={20} />
                          ) : (
                            <>
                              {step === 0 && <IconSchool size={20} />}
                              {step === 1 && <IconLanguage size={20} />}
                              {step === 2 && <IconStar size={20} />}
                              {step === 3 && <IconClock size={20} />}
                              {step === 4 && <IconRobot size={20} />}
                            </>
                          )}
                        </ThemeIcon>
                        <Text size="sm" fw={step === activeStep ? 600 : 400}>
                          {step === 0 ? 'Why Learn?' : 
                           step === 1 ? 'Language' : 
                           step === 2 ? 'Proficiency' : 
                           step === 3 ? 'Daily Goal' : 
                           'AI Style'}
                        </Text>
                      </Flex>
                    </Box>
                    
                    {step < 4 && (
                      <Box mx={rem(4)} style={{ opacity: step < activeStep ? 0.9 : 0.3 }}>
                        <IconChevronRight size={16} />
                      </Box>
                    )}
                  </React.Fragment>
                ))}
              </Flex>
              
              <Box>
                {activeStep === 0 && (
                  <Paper 
                    radius="md" 
                    p="xl" 
                    style={glassEffect}
                  >
                    <Group mb={rem(20)}>
                      <ThemeIcon 
                        size={48} 
                        radius="xl" 
                        variant="light" 
                        color="blue"
                        style={{ backgroundColor: 'rgba(65, 149, 211, 0.1)' }}
                      >
                        <IconSchool size={24} />
                      </ThemeIcon>
                      <Box>
                        <Title order={3}>Your Motivation</Title>
                        <Text size="sm" c="dimmed">Why are you learning a language?</Text>
                      </Box>
                    </Group>
                    
                    <Divider 
                      my={rem(20)} 
                      style={{ 
                        borderColor: 'rgba(255, 255, 255, 0.05)' 
                      }} 
                    />
                    
                    <Select
                      placeholder="Choose your motivation"
                      data={motivations}
                      value={motivation}
                      onChange={(val) => setMotivation(val || '')}
                      size="md"
                      radius="md"
                      style={{
                        backgroundColor: 'rgba(37, 38, 43, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      styles={{
                        dropdown: {
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: 'rgba(37, 38, 43, 0.95)',
                          backdropFilter: 'blur(10px)'
                        }
                      }}
                      required
                    />
                  </Paper>
                )}

                {activeStep === 1 && (
                  <Paper 
                    radius="md" 
                    p="xl" 
                    style={glassEffect}
                  >
                    <Group mb={rem(20)}>
                      <ThemeIcon 
                        size={48} 
                        radius="xl" 
                        variant="light" 
                        color="violet"
                        style={{ backgroundColor: 'rgba(131, 102, 209, 0.1)' }}
                      >
                        <IconLanguage size={24} />
                      </ThemeIcon>
                      <Box>
                        <Title order={3}>Choose Language</Title>
                        <Text size="sm" c="dimmed">Which language would you like to learn? (this can be changed)</Text>
                      </Box>
                    </Group>
                    
                    <Divider 
                      my={rem(20)} 
                      style={{ 
                        borderColor: 'rgba(255, 255, 255, 0.05)' 
                      }} 
                    />
                    
                    <Select
                      placeholder="Select language"
                      data={languages}
                      value={language}
                      onChange={(val) => setLanguage(val || '')}
                      size="md"
                      radius="md"
                      style={{
                        backgroundColor: 'rgba(37, 38, 43, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      styles={{
                        dropdown: {
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: 'rgba(37, 38, 43, 0.95)',
                          backdropFilter: 'blur(10px)'
                        }
                      }}
                      required
                    />
                  </Paper>
                )}

                {activeStep === 2 && (
                  <Paper 
                    radius="md" 
                    p="xl" 
                    style={glassEffect}
                  >
                    <Group mb={rem(20)}>
                      <ThemeIcon 
                        size={48} 
                        radius="xl" 
                        variant="light" 
                        color="teal"
                        style={{ backgroundColor: 'rgba(67, 197, 158, 0.1)' }}
                      >
                        <IconStar size={24} />
                      </ThemeIcon>
                      <Box>
                        <Title order={3}>Your Level</Title>
                        <Text size="sm" c="dimmed">How would you rate your current skill?</Text>
                      </Box>
                    </Group>
                    
                    <Divider 
                      my={rem(20)} 
                      style={{ 
                        borderColor: 'rgba(255, 255, 255, 0.05)' 
                      }} 
                    />
                    
                    <Radio.Group
                      value={level}
                      onChange={setLevel}
                      required
                      size="md"
                      style={{ marginBottom: rem(8) }}
                    >
                      <Stack gap={rem(10)}>
                        {proficiencyLevels.map((lvl) => (
                          <Radio 
                            key={lvl} 
                            value={lvl} 
                            label={lvl} 
                            styles={{
                              radio: {
                                '&[data-checked]': {
                                  backgroundColor: `${accentGreen}`,
                                  borderColor: `${accentGreen}`
                                }
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </Radio.Group>
                  </Paper>
                )}

                {activeStep === 3 && (
                  <Paper 
                    radius="md" 
                    p="xl" 
                    style={glassEffect}
                  >
                    <Group mb={rem(20)}>
                      <ThemeIcon 
                        size={48} 
                        radius="xl" 
                        variant="light" 
                        color="orange"
                        style={{ backgroundColor: 'rgba(230, 133, 74, 0.1)' }}
                      >
                        <IconClock size={24} />
                      </ThemeIcon>
                      <Box>
                        <Title order={3}>Daily Commitment</Title>
                        <Text size="sm" c="dimmed">How much time will you dedicate each day?</Text>
                      </Box>
                    </Group>
                    
                    <Divider 
                      my={rem(20)} 
                      style={{ 
                        borderColor: 'rgba(255, 255, 255, 0.05)' 
                      }} 
                    />
                    
                    <Text mb={rem(16)}>Minutes per day:</Text>
                    <Slider
                      min={5}
                      max={30}
                      step={5}
                      marks={[
                        { value: 5, label: '5' },
                        { value: 15, label: '15' },
                        { value: 30, label: '30' }
                      ]}
                      value={dailyGoal}
                      onChange={setDailyGoal}
                      size="md"
                      radius="xl"
                      color={accentOrange.replace('#', '')}
                      styles={{
                        track: {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        mark: {
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          width: 6,
                          height: 6
                        },
                        markLabel: {
                          fontSize: 12,
                          marginTop: 5
                        }
                      }}
                      mb={rem(24)}
                    />
                    
                    <Group mt={rem(20)}>
                      <Switch
                        label="Enable daily reminders"
                        checked={notificationsEnabled}
                        onChange={(e) => setNotificationsEnabled(e.currentTarget.checked)}
                        size="md"
                        color={accentOrange.replace('#', '')}
                        styles={{
                          track: {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '&[data-checked]': {
                              backgroundColor: accentOrange
                            }
                          }
                        }}
                      />
                    </Group>
                  </Paper>
                )}

                {activeStep === 4 && (
                  <Paper 
                    radius="md" 
                    p="xl" 
                    style={glassEffect}
                  >
                    <Group mb={rem(20)}>
                      <ThemeIcon 
                        size={48} 
                        radius="xl" 
                        variant="light" 
                        color="blue"
                        style={{ backgroundColor: 'rgba(65, 149, 211, 0.1)' }}
                      >
                        <IconRobot size={24} />
                      </ThemeIcon>
                      <Box>
                        <Title order={3}>AI Coach Style</Title>
                        <Text size="sm" c="dimmed">How should your AI language coach communicate?</Text>
                      </Box>
                    </Group>
                    
                    <Divider 
                      my={rem(20)} 
                      style={{ 
                        borderColor: 'rgba(255, 255, 255, 0.05)' 
                      }} 
                    />
                    
                    <Select
                      placeholder="Choose feedback style"
                      data={feedbackStyles}
                      value={feedbackStyle}
                      onChange={(val) => setFeedbackStyle(val || '')}
                      size="md"
                      radius="md"
                      style={{
                        backgroundColor: 'rgba(37, 38, 43, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      styles={{
                        dropdown: {
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: 'rgba(37, 38, 43, 0.95)',
                          backdropFilter: 'blur(10px)'
                        }
                      }}
                    />
                  </Paper>
                )}
              </Box>

              <Group mt={rem(30)} justify="flex-end">
                {activeStep > 0 && (
                  <Button 
                    variant="default"
                    onClick={() => setActiveStep(current => current - 1)}
                    size="md"
                    radius="xl"
                    style={glassmorphicButton}
                  >
                    Back
                  </Button>
                )}
                
                <Button 
                  onClick={handleNext} 
                  disabled={(activeStep === 0 && !motivation) || isSubmitting}
                  loading={isSubmitting}
                  size="md"
                  radius="xl"
                  variant="default"
                  style={{
                    ...glassmorphicButton,
                    borderColor: activeStep === 4 ? 'rgba(131, 102, 209, 0.2)' : 'rgba(65, 149, 211, 0.2)',
                    color: '#fff'
                  }}
                >
                  {activeStep === 4 ? 'Finish & Start Learning' : 'Continue'}
                </Button>
              </Group>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};
