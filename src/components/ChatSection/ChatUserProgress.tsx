import React from 'react';
import { Group, Paper, RingProgress, Text, Badge, Center, Tooltip } from '@mantine/core';
import { IconTrophy, IconBrain, IconFlame, IconVocabulary } from '@tabler/icons-react';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useMemo } from 'react';
import { keyframes } from '@emotion/react';

const pulseAnimation = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.1)' },
  '100%': { transform: 'scale(1)' }
});

interface ChatUserProgressProps {
  language?: string;
  compact?: boolean;
}

export const ChatUserProgress: React.FC<ChatUserProgressProps> = ({ 
  language,
  compact = false
}) => {
  const { userProfile, isLoading } = useUserProfile();

  const progressData = useMemo(() => {
    if (!userProfile) return null;

    const targetLanguage = language?.toLowerCase() || userProfile.settings.preferredLanguage;
    const langProgress = userProfile.languages[targetLanguage];

    if (!langProgress) {
      return {
        level: 'beginner',
        xp: 0,
        wordsLearned: 0,
        progress: 0,
        nextLevelXp: 1000,
      };
    }

    
    let progress = 0;
    let nextLevelXp = 0;
    const { proficiencyLevel, experiencePoints } = langProgress;

    if (proficiencyLevel === 'beginner' && experiencePoints < 1000) {
      progress = Math.min(100, Math.round((experiencePoints / 1000) * 100));
      nextLevelXp = 1000 - experiencePoints;
    } else if (proficiencyLevel === 'intermediate' && experiencePoints < 3000) {
      progress = Math.min(100, Math.round(((experiencePoints - 1000) / 2000) * 100));
      nextLevelXp = 3000 - experiencePoints;
    } else if (proficiencyLevel === 'advanced' && experiencePoints < 6000) {
      progress = Math.min(100, Math.round(((experiencePoints - 3000) / 3000) * 100));
      nextLevelXp = 6000 - experiencePoints;
    } else {
      progress = 100;
      nextLevelXp = 0;
    }

    return {
      level: proficiencyLevel,
      xp: experiencePoints,
      wordsLearned: langProgress.wordsLearned,
      progress,
      nextLevelXp,
    };
  }, [userProfile, language]);

  if (isLoading || !userProfile || !progressData) {
    return null;
  }

  
  const levelColors: Record<string, string> = {
    beginner: 'blue',
    intermediate: 'teal',
    advanced: 'violet',
    fluent: 'grape'
  };

  const levelColor = levelColors[progressData.level] || 'blue';

  
  if (compact) {
    return (
      <Group gap="xs">
        <Tooltip label={`${progressData.xp} XP`}>
          <Group gap={5}>
            <IconTrophy size={16} style={{ color: levelColor }} />
            <Text size="xs" fw={500}>
              {Math.floor(progressData.xp / 100) * 100}+
            </Text>
          </Group>
        </Tooltip>
        
        <Tooltip label={`${progressData.wordsLearned} words learned`}>
          <Group gap={5}>
            <IconVocabulary size={16} style={{ color: '#ff7b5c' }} />
            <Text size="xs" fw={500}>
              {progressData.wordsLearned}
            </Text>
          </Group>
        </Tooltip>
        
        <Badge 
          size="xs" 
          color={levelColor}
          variant="dot"
        >
          {progressData.level.charAt(0).toUpperCase() + progressData.level.slice(1)}
        </Badge>
      </Group>
    );
  }

  return (
    <Paper p="sm" radius="md" withBorder bg="rgba(0, 0, 0, 0.2)">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconBrain size={16} style={{ color: levelColor }} />
          <Text size="sm" fw={500}>
            {progressData.level.charAt(0).toUpperCase() + progressData.level.slice(1)}
          </Text>
        </Group>
        
        <Badge size="sm" color={levelColor}>
          {progressData.xp} XP
        </Badge>
      </Group>
      
      <Group justify="space-between" mb="md" align="center">
        <RingProgress
          size={50}
          thickness={4}
          roundCaps
          sections={[{ value: progressData.progress, color: levelColor }]}
          label={
            <Center>
              <Text fw={700} size="xs">
                {progressData.progress}%
              </Text>
            </Center>
          }
        />
        
        <div style={{ flex: 1, maxWidth: '70%' }}>
          {progressData.nextLevelXp > 0 ? (
            <Text size="xs" color="dimmed">
              {progressData.nextLevelXp} XP to next level
            </Text>
          ) : (
            <Text size="xs" color="dimmed">
              Max level reached
            </Text>
          )}
        </div>
      </Group>
      
      <Group justify="space-between">
        <Group gap="xs" align="center">
          <IconVocabulary size={16} style={{ color: '#ff7b5c' }} />
          <Text size="xs" fw={500}>
            {progressData.wordsLearned} words
          </Text>
        </Group>
        
        <Group gap="xs" align="center">
          <IconFlame
            size={16}
            color="orange"
            style={{ animation: `${pulseAnimation} 1.5s infinite ease-in-out` }}
          />
          <Text size="xs" fw={500}>
            {userProfile.streak.currentStreak} day streak
          </Text>
        </Group>
      </Group>
    </Paper>
  );
}; 