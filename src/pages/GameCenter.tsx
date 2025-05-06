import React, { useState } from 'react';
import {
  AppShell,
  Container,
  Title,
  Text,
  Stack,
  Grid,
  Paper,
  Group,
  Badge,
  Button,
  Modal
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from '../components/Header/Header';
import { WordMatch } from '../components/Games/WordMatch';
import { WordScramble } from '../components/Games/WordScramble';
import { SentenceBuilder } from '../components/Games/SentenceBuilder';

interface GameStats {
  gamesPlayed: number;
  highScore: number;
  lastPlayed: string;
}

interface Game {
  id: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER';
  type: 'VOCABULARY'
  stats: GameStats;
  language: string;
  available: boolean;
}

const mockGames: Game[] = [
  {
    id: '1',
    title: 'Word Match',
    description: 'Match words with their translations against the clock.',
    difficulty: 'BEGINNER',
    type: 'VOCABULARY',
    language: 'Spanish',
    available: true,
    stats: {
      gamesPlayed: 15,
      highScore: 2800,
      lastPlayed: '2024-02-18'
    }
  },
  {
    id: '2',
    title: 'Word Scramble',
    description: 'Unscramble letters to form the correct word.',
    difficulty: 'BEGINNER',
    type: 'VOCABULARY',
    language: 'Spanish',
    available: true,
    stats: {
      gamesPlayed: 0,
      highScore: 0,
      lastPlayed: ''
    }
  },
  {
    id: '4',
    title: 'Sentence Builder',
    description: 'Arrange words to form grammatically correct sentences.',
    difficulty: 'BEGINNER',
    type: 'VOCABULARY',
    language: 'Spanish',
    available: true,
    stats: {
      gamesPlayed: 0,
      highScore: 0,
      lastPlayed: ''
    }
  },
];

const GameCard: React.FC<{
  game: Game;
  onPlay: () => void;
}> = ({ game, onPlay }) => (
    <Paper
        p="xl"
        radius="md"
        style={{
          backgroundColor: '#25262B',
          height: '100%',
        }}
    >
      <Stack>
        <Group align="flex-start">
          <Title order={3} c="white" style={{ fontSize: '20px' }}>
            {game.title}
          </Title>
          <Group>
            <Badge
                color={game.difficulty === 'BEGINNER' ? 'green' : 'blue'}
                variant="filled"
                style={{ textTransform: 'capitalize' }}
            >
              {game.difficulty.toLowerCase()}
            </Badge>
            <Badge
                color="gray"
                variant="outline"
                style={{ textTransform: 'capitalize' }}
            >
              {game.type.toLowerCase()}
            </Badge>
          </Group>
        </Group>

        <Text c="dimmed" size="sm">
          {game.description}
        </Text>

        {game.available && (
            <Group mt="auto">
              <Group>
                <Stack>
                  <Text size="xs" c="dimmed">Games Played</Text>
                  <Text>{game.stats.gamesPlayed}</Text>
                </Stack>
                <Stack>
                  <Text size="xs" c="dimmed">High Score</Text>
                  <Text>{game.stats.highScore}</Text>
                </Stack>
              </Group>
            </Group>
        )}

        {game.available ? (
            <Group align="center">
              <Button
                  variant="filled"
                  color="blue"
                  onClick={onPlay}
              >
                Play Now
              </Button>
            </Group>
        ) : (
            <Group>
              <Button variant="light" color="gray" disabled>
                Coming Soon
              </Button>
            </Group>
        )}
      </Stack>
    </Paper>
);

export const GameCenter: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const handleModeChange = (mode: string) => {
    console.log('Mode changed:', mode);
  };

  const handleGameComplete = (gameId: string, score: number) => {
    const game = mockGames.find(g => g.id === gameId);
    if (game) {
      game.stats.gamesPlayed += 1;
      game.stats.highScore = Math.max(game.stats.highScore, score);
      game.stats.lastPlayed = new Date().toISOString().split('T')[0];
    }
    close();
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
            width: '100%',
            backgroundColor: '#1A1B1E',
          }}
      >
        <Header
            selectedMode="tutor"
            onModeChange={handleModeChange}
            onResetAPIKey={() => console.log('Reset API key')}
            showSettings={true} 
        />

        <AppShell.Main style={{ height: 'calc(100vh - 60px)', backgroundColor: '#1A1B1E', overflowY: 'auto' }}>
          <Container size="xl" py="xl">
            <Stack>
              <div>
                <Title order={1} c="white" mb="xs">Game Center</Title>
                <Text c="dimmed">Practice your language skills through interactive games</Text>
              </div>

              <Grid>
                {mockGames.map((game) => (
                    <Grid.Col key={game.id} span={{ base: 12, sm: 6, lg: 4 }}>
                      <GameCard
                          game={game}
                          onPlay={() => {
                            setSelectedGame(game);
                            open();
                          }}
                      />
                    </Grid.Col>
                ))}
              </Grid>
            </Stack>
          </Container>
        </AppShell.Main>

        <Modal
            opened={opened}
            onClose={close}
            size="xl"
            radius="md"
            padding="lg"
            withCloseButton={false}
            centered
            styles={{
              body: {
                padding: '24px',
              },
              content: {
                backgroundColor: '#1A1B1E',
              }
            }}
        >
          {selectedGame?.id === '1' && (
              <WordMatch
                  onClose={close}
                  onGameComplete={(score) => handleGameComplete(selectedGame.id, score)}
              />
          )}
          {selectedGame?.id === '2' && (
              <WordScramble
                  onClose={close}
                  onGameComplete={(score) => handleGameComplete(selectedGame.id, score)}
              />
          )}
          {selectedGame?.id === '4' && (
              <SentenceBuilder
                  onClose={close}
                  onGameComplete={(score) => handleGameComplete(selectedGame.id, score)}
              />
          )}
        </Modal>
      </AppShell>
  );
};

export default GameCenter;