import React from 'react';
import { AppShell, Container, Title, Text, Stack, Grid, Paper, Group } from '@mantine/core';
import { Header } from '../components/Header/Header';
import { PieChart } from '@mantine/charts';
import { pageStyles } from './styles';

const mockData = {
  totalSessions: 24,
  totalMinutes: 360,
  averageScore: 85,
  languageBreakdown: [
    { name: 'Spanish', value: 45, color: 'blue' },
    { name: 'French', value: 25, color: 'blue' },
    { name: 'German', value: 20, color: 'blue' },
    { name: 'Italian', value: 10, color: 'blue' },
  ],
  recentProgress: [
    { date: '2024-01-01', score: 75 },
    { date: '2024-01-02', score: 78 },
    { date: '2024-01-03', score: 80 },
    { date: '2024-01-04', score: 82 },
    { date: '2024-01-05', score: 85 },
  ],
};

export const Statistics: React.FC = () => {
  const handleModeChange = (mode: string) => {
    console.log('Mode changed:', mode);
  };

  const handleResetAPIKey = () => {
    console.log('Reset API key');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
      style={{ 
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <Header
        selectedMode="tutor"
        onModeChange={handleModeChange}
        onResetAPIKey={handleResetAPIKey}
        showSettings={false}
      />

      <AppShell.Main>
        <Container size="xl" style={pageStyles.container}>
          <Stack gap="xl">
            <Title order={2}>Learning Statistics</Title>

            <Grid>
              {/* Summary Cards */}
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper shadow="sm" p="md" radius="md">
                  <Stack>
                    <Text size="lg" fw={500}>Total Sessions</Text>
                    <Group justify="space-between" align="flex-end">
                      <Text size="xl" fw={700}>{mockData.totalSessions}</Text>
                      <Text size="sm" c="dimmed">sessions</Text>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper shadow="sm" p="md" radius="md">
                  <Stack>
                    <Text size="lg" fw={500}>Practice Time</Text>
                    <Group justify="space-between" align="flex-end">
                      <Text size="xl" fw={700}>{mockData.totalMinutes}</Text>
                      <Text size="sm" c="dimmed">minutes</Text>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper shadow="sm" p="md" radius="md">
                  <Stack>
                    <Text size="lg" fw={500}>Average Score</Text>
                    <Group justify="space-between" align="flex-end">
                      <Text size="xl" fw={700}>{mockData.averageScore}%</Text>
                      <Text size="sm" c="dimmed">proficiency</Text>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Language Distribution */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper shadow="sm" p="md" radius="md">
                  <Stack>
                    <Text size="lg" fw={500}>Language Distribution</Text>
                    <PieChart
                      data={mockData.languageBreakdown}
                      size={300}
                      withLabels
                      withTooltip
                      tooltipDataSource="segment"
                    />
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Recent Progress */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper shadow="sm" p="md" radius="md">
                  <Stack>
                    <Text size="lg" fw={500}>Recent Progress</Text>
                    {/* Add a line chart here */}
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
