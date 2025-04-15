import React from 'react';
import { useUser } from "@clerk/clerk-react";
import {
  Box,
  Title,
  Text,
  Stack,
  Grid,
  Paper,
  Group,
  Badge,
  Progress,
  Avatar,
  Tabs,
  RingProgress,
  Card,
} from '@mantine/core';
import {
  IconUser,
  IconStars,
  IconCertificate,
  IconFlag,
  IconBrain,
  IconClockHour4
} from '@tabler/icons-react';
import { Header } from '../components/Header/Header';
import { pageStyles } from './styles';

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  chart?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, chart = null }) => (
    <Paper p="lg" radius="md" style={{ backgroundColor: '#25262B', height: '100%' }}>
      <Stack>
        <Text size="sm" c="dimmed" style={{ fontSize: '14px' }}>
          {title}
        </Text>
        <Group justify="space-between" align="flex-end" style={{ marginTop: '4px' }}>
          <Text size="xl" fw={500} style={{ fontSize: '24px' }}>
            {value}
          </Text>
          <Text size="sm" c="dimmed" style={{ fontSize: '12px' }}>
            {unit}
          </Text>
        </Group>
        {chart && <div style={{ marginTop: '8px' }}>{chart}</div>}
      </Stack>
    </Paper>
);

interface LanguageProgressCardProps {
  data: {
    language: string;
    level: string;
    progress: number;
    totalHours: number;
    streak: number;
  }
}

const LanguageProgressCard: React.FC<LanguageProgressCardProps> = ({ data }) => (
    <Paper p="xl" radius="md" style={{ backgroundColor: '#25262B' }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={500} size="lg">{data.language}</Text>
          <Badge variant="light" size="sm">Level {data.level}</Badge>
        </div>
        <RingProgress
            size={80}
            thickness={8}
            sections={[{ value: data.progress, color: '#3B82F6' }]}
            label={
              <Text ta="center" size="sm">
                {data.progress}%
              </Text>
            }
        />
      </Group>
      <Progress
          value={data.progress}
          size="md"
          radius="xl"
          mb="md"
          color="#3B82F6"
          style={{ backgroundColor: '#2C2E33' }}
      />
      <Group>
        <Stack gap="xs">
          <Text size="sm" c="dimmed">Total Hours</Text>
          <Text fw={500}>{data.totalHours}h</Text>
        </Stack>
        <Stack gap="xs">
          <Text size="sm" c="dimmed">Current Streak</Text>
          <Text fw={500}>{data.streak} days</Text>
        </Stack>
      </Group>
    </Paper>
);

const mockData = {
  totalSessions: 24,
  totalMinutes: 360,
  averageScore: 85,
  streakDays: 7,
  weeklyGoal: 75,
  weeklyProgress: 65,
  languageDetails: [
    { language: 'Spanish', level: 'B2', progress: 78, totalHours: 45, streak: 7 },
    { language: 'French', level: 'B1', progress: 45, totalHours: 20, streak: 3 },
    { language: 'German', level: 'A2', progress: 90, totalHours: 15, streak: 5 }
  ],
  achievements: [
    {
      id: '1',
      title: 'First Lesson',
      description: 'Completed your first language lesson',
      icon: <IconBrain size={24} />,
      earned: true,
      date: '2024-02-15'
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Maintained a 7-day study streak',
      icon: <IconClockHour4 size={24} />,
      earned: true,
      date: '2024-02-10'
    },
    {
      id: '3',
      title: 'Polyglot Path',
      description: 'Started learning a second language',
      icon: <IconFlag size={24} />,
      earned: true,
      date: '2024-01-20'
    }
  ]
};

export const ProfileDashboard = () => {
  const { user } = useUser();

  // Fixed header implementation with proper props
  const handleModeChange = (mode: string) => {
    console.log('Mode changed:', mode);
  };

  return (
      <>
        <Header
            selectedMode="profile"
            onModeChange={handleModeChange}
            onResetAPIKey={() => console.log('Reset API key')}
            showSettings={true}
        />

        <Box style={pageStyles.container}>
          <Title order={1} c="white" mb="xs">Dashboard</Title>
          <Text c="dimmed">View your languages, achievements, and detailed statistics</Text>

          <Stack gap="lg" mt="xl">
            <Paper p="xl" radius="md" style={{ backgroundColor: '#25262B' }}>
              <Group>
                <Avatar
                    src={user?.imageUrl}
                    size={100}
                    radius="xl" />
                <div>
                  <Title order={2} c="white">{user?.fullName}</Title>
                  <Text c="dimmed" size="sm">{user?.primaryEmailAddress?.emailAddress}</Text>
                  <Group mt="xs">
                    <Badge
                        variant="filled"
                        color="blue"
                        leftSection={<IconUser size={12} />}
                    >
                      Level {Math.floor(mockData.totalSessions / 10)}
                    </Badge>
                    <Badge
                        variant="filled"
                        color="green"
                        leftSection={<IconStars size={12} />}
                    >
                      {mockData.languageDetails.length} Languages
                    </Badge>
                  </Group>
                </div>
              </Group>
            </Paper>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <StatCard
                    title="Total Sessions"
                    value={mockData.totalSessions}
                    unit="sessions" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <StatCard
                    title="Practice Time"
                    value={mockData.totalMinutes}
                    unit="minutes" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <StatCard
                    title="Average Score"
                    value={`${mockData.averageScore}%`}
                    unit="proficiency" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <StatCard
                    title="Weekly Goal"
                    value={`${mockData.weeklyProgress}`}
                    unit={`of ${mockData.weeklyGoal} minutes`}
                    chart={<Progress
                        value={mockData.weeklyProgress}
                        size="md"
                        radius="xl"
                        color="#3B82F6"
                        style={{ backgroundColor: '#2C2E33' }} />} />
              </Grid.Col>
            </Grid>

            <Tabs defaultValue="languages" variant="outline">
              <Tabs.List>
                <Tabs.Tab value="languages">Languages</Tabs.Tab>
                <Tabs.Tab value="achievements">Achievements</Tabs.Tab>
                <Tabs.Tab value="statistics">Statistics</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="languages" pt="xl">
                <Grid>
                  {mockData.languageDetails.map((lang) => (
                      <Grid.Col key={lang.language} span={{ base: 12, md: 6 }}>
                        <LanguageProgressCard data={lang} />
                      </Grid.Col>
                  ))}
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="achievements" pt="xl">
                <Grid>
                  {mockData.achievements.map((achievement) => (
                      <Grid.Col key={achievement.id} span={{ base: 12, sm: 6, md: 4 }}>
                        <Card p="xl" radius="md" style={{ backgroundColor: '#25262B' }}>
                          <Group mb="md">
                            <div style={{ color: '#3B82F6' }}>
                              {achievement.icon}
                            </div>
                            <Badge color="green" variant="light">
                              Earned
                            </Badge>
                          </Group>
                          <Text fw={500} mb="xs">{achievement.title}</Text>
                          <Text size="sm" c="dimmed" mb="md">
                            {achievement.description}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Earned on {new Date(achievement.date).toLocaleDateString()}
                          </Text>
                        </Card>
                      </Grid.Col>
                  ))}
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="statistics" pt="xl">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="xl" radius="md" style={{ backgroundColor: '#25262B' }}>
                      <Stack>
                        <Text size="sm" c="dimmed">Total Practice Time</Text>
                        <Group>
                          <Text fw={700} size="xl">
                            {Math.round(mockData.totalMinutes / 60)} hours
                          </Text>
                          <IconClockHour4 size={24} style={{ color: '#3B82F6' }} />
                        </Group>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="xl" radius="md" style={{ backgroundColor: '#25262B' }}>
                      <Stack>
                        <Text size="sm" c="dimmed">Current Streak</Text>
                        <Group>
                          <Text fw={700} size="xl">{mockData.streakDays} days</Text>
                          <IconUser size={24} style={{ color: '#3B82F6' }} />
                        </Group>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="xl" radius="md" style={{ backgroundColor: '#25262B' }}>
                      <Stack>
                        <Text size="sm" c="dimmed">Weekly Goal Progress</Text>
                        <Group>
                          <Text fw={700} size="xl">{mockData.weeklyProgress}%</Text>
                          <IconBrain size={24} style={{ color: '#3B82F6' }} />
                        </Group>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Box>
      </>
  );
};

export default ProfileDashboard;