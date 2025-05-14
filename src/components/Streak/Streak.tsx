import { Paper, Text, Group, RingProgress, Center } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import { useUserProfile } from '../../contexts/UserProfileContext';

export const Streak: React.FC = () => {
  const { userProfile } = useUserProfile();
  
  if (!userProfile) {
    return (
      <Paper shadow="sm" p="md" withBorder>
        <Text size="xl" fw={700} c="orange">
          Loading streak data...
        </Text>
      </Paper>
    );
  }

  const { currentStreak, highestStreak } = userProfile.streak;

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group p="apart">
        <div>
          <Text size="xl" fw={700} c="orange">
            {currentStreak} Day Streak
          </Text>
          <Text size="sm" color="dimmed">
            Highest: {highestStreak} days
          </Text>
        </div>
        <RingProgress
          size={80}
          thickness={8}
          sections={[{ value: (currentStreak / 7) * 100, color: 'orange' }]}
          label={
            <Center>
              <IconFlame size={20} color="orange" />
            </Center>
          }
        />
      </Group>
    </Paper>
  );
};