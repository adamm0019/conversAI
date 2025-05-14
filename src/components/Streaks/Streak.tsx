import { Paper, Text, Group, RingProgress, Center } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import { useStreak } from '../../hooks/useStreak';
import React, { useEffect } from 'react';

export const Streak: React.FC = () => {
  const { getStreakFromStorage, updateStreak } = useStreak();
  const streak = getStreakFromStorage();
  
  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group p="apart">
        <div>
          <Text size="xl" fw={700} c="orange">
            {streak.currentStreak} Day Streak
          </Text>
          <Text size="sm" color="dimmed">
            Highest: {streak.highestStreak} days
          </Text>
        </div>
        <RingProgress
          size={80}
          thickness={8}
          sections={[{ value: (streak.currentStreak / 7) * 100, color: 'orange' }]}
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