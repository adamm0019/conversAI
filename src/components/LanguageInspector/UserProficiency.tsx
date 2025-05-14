import { Paper, Text, Group, Progress, Badge, Stack } from '@mantine/core';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { ProficiencyLevel } from '../../contexts/UserProfileContext';


const LEVELS = {
  beginner: { min: 0, max: 999, color: 'blue' },
  intermediate: { min: 1000, max: 2999, color: 'teal' },
  advanced: { min: 3000, max: 5999, color: 'violet' },
  fluent: { min: 6000, max: Infinity, color: 'grape' },
};


const getNextLevel = (current: ProficiencyLevel): ProficiencyLevel | null => {
  switch (current) {
    case 'beginner': return 'intermediate';
    case 'intermediate': return 'advanced';
    case 'advanced': return 'fluent';
    case 'fluent': return null;
    default: return null;
  }
};


const formatLevel = (level: ProficiencyLevel): string => {
  return level.charAt(0).toUpperCase() + level.slice(1);
};

interface UserProficiencyProps {
  language?: string; 
}

export const UserProficiency: React.FC<UserProficiencyProps> = ({ language }) => {
  const { userProfile, isLoading } = useUserProfile();
  
  if (isLoading || !userProfile) {
    return (
      <Paper shadow="sm" p="md" withBorder>
        <Text>Loading proficiency data...</Text>
      </Paper>
    );
  }

  
  const targetLanguage = language || userProfile.settings.preferredLanguage;
  
  
  const languageProgress = userProfile.languages[targetLanguage] || {
    proficiencyLevel: 'beginner' as ProficiencyLevel,
    experiencePoints: 0,
    wordsLearned: 0,
    lessonsCompleted: 0,
    lastActiveDate: '',
  };
  
  const { proficiencyLevel, experiencePoints, wordsLearned, lessonsCompleted } = languageProgress;
  
  
  const currentLevel = LEVELS[proficiencyLevel];
  
  
  const nextLevel = getNextLevel(proficiencyLevel);
  let progressPercentage = 100;
  let xpToNextLevel = 0;
  
  if (nextLevel) {
    const nextLevelThreshold = LEVELS[nextLevel].min;
    const currentLevelMin = currentLevel.min;
    const levelRange = nextLevelThreshold - currentLevelMin;
    const userProgress = experiencePoints - currentLevelMin;
    progressPercentage = Math.min(100, Math.round((userProgress / levelRange) * 100));
    xpToNextLevel = nextLevelThreshold - experiencePoints;
  }

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={700}>{targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)} Proficiency</Text>
          <Badge color={currentLevel.color} size="lg">
            {formatLevel(proficiencyLevel)}
          </Badge>
        </Group>
        
        <div>
          <Group justify="space-between" mb={5}>
            <Text size="sm">Experience: {experiencePoints} XP</Text>
            {nextLevel && (
              <Text size="sm" color="dimmed">{xpToNextLevel} XP to {formatLevel(nextLevel)}</Text>
            )}
          </Group>
          <Progress 
            value={progressPercentage} 
            color={currentLevel.color}
            size="md"
            radius="xl"
          />
        </div>
        
        <Group justify="space-between">
          <div>
            <Text fw={700}>{wordsLearned}</Text>
            <Text size="xs" color="dimmed">Words Learned</Text>
          </div>
          <div>
            <Text fw={700}>{lessonsCompleted}</Text>
            <Text size="xs" color="dimmed">Lessons Completed</Text>
          </div>
        </Group>
      </Stack>
    </Paper>
  );
}; 