import React from 'react';
import { Group, ActionIcon, Tooltip, Container, rem, useMantineColorScheme, Menu, Box, Button, Popover, Stack, Text } from '@mantine/core';
import { 
  IconBrain,
  IconSettings,
  IconHistory,
  IconChartBar,
  IconSun,
  IconMoon,
  IconMenu2,
  IconRobot,
  IconBulb,
  IconSchool,
  IconFriends
} from '@tabler/icons-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import { headerStyles } from './styles';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import conversationLogoDark from '../../assets/conversationlogodarkmode.svg';
import conversationLogoLight from '../../assets/conversationlogolightmode.svg';

interface HeaderProps {
  selectedMode: string;
  onModeChange: (value: string) => void;
  onResetAPIKey: () => void;
  showSettings: boolean;
}

const conversationModes = [
  {
    id: 'tutor',
    icon: IconSchool,
    label: 'Language Tutor',
    description: 'Structured learning with a patient teacher',
  },
  {
    id: 'friend',
    icon: IconFriends,
    label: 'Friendly Chat',
    description: 'Casual conversation with a native speaker',
  },
  {
    id: 'expert',
    icon: IconBulb,
    label: 'Expert Mode',
    description: 'Advanced discussions on specific topics',
  },
];

export const Header: React.FC<HeaderProps> = ({
  selectedMode,
  onModeChange,
  onResetAPIKey,
  showSettings,
}) => {
  const [settingsOpened, setSettingsOpened] = React.useState(false);
  const [modePopoverOpened, setModePopoverOpened] = React.useState(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const selectedModeInfo = conversationModes.find(mode => mode.id === selectedMode);
  const ModeIcon = selectedModeInfo?.icon || IconRobot;

  const MobileMenu = () => (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="blue"
          size="lg"
          style={headerStyles.actionButton}
        >
          <IconMenu2 style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Conversation Modes</Menu.Label>
        {conversationModes.map(mode => (
          <Menu.Item
            key={mode.id}
            leftSection={<mode.icon size={14} />}
            onClick={() => onModeChange(mode.id)}
          >
            {mode.label}
          </Menu.Item>
        ))}

        <Menu.Divider />

        <Menu.Label>Progress</Menu.Label>
        <Menu.Item
          leftSection={<IconChartBar size={14} />}
          component={Link}
          to="/statistics"
        >
          Statistics
        </Menu.Item>
        <Menu.Item leftSection={<IconHistory size={14} />}>
          History
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          leftSection={colorScheme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
          onClick={toggleColorScheme}
        >
          {colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Menu.Item>

        {showSettings && (
          <Menu.Item
            leftSection={<IconSettings size={14} />}
            onClick={() => setSettingsOpened(true)}
          >
            Settings
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );

  return (
    <>
      <div style={headerStyles.header}>
        <Container size="xl">
          <div style={headerStyles.navbarInner}>
            <Group style={headerStyles.languageGroup}>
              <Box hiddenFrom="sm">
                <Link to="/">
                  <img 
                    src={colorScheme === 'dark' ? conversationLogoDark : conversationLogoLight} 
                    alt="Conversation Logo" 
                    style={{...headerStyles.logo, height: rem(120)}}
                  />
                </Link>
              </Box>
              <Box visibleFrom="sm">
                <Link to="/">
                  <img 
                    src={colorScheme === 'dark' ? conversationLogoDark : conversationLogoLight} 
                    alt="Conversation Logo" 
                    style={headerStyles.logo}
                  />
                </Link>
              </Box>

              <Box visibleFrom="sm" style={{ minWidth: '400px' }}>
                <Group>
                  <Popover
                    opened={modePopoverOpened}
                    onChange={setModePopoverOpened}
                    position="bottom"
                    width={300}
                  >
                    <Popover.Target>
                      <Button
                        variant="light"
                        leftSection={<ModeIcon size={16} />}
                        onClick={() => setModePopoverOpened(true)}
                      >
                        {selectedModeInfo?.label || 'Select Mode'}
                      </Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack>
                        {conversationModes.map(mode => (
                          <Button
                            key={mode.id}
                            variant={selectedMode === mode.id ? 'filled' : 'subtle'}
                            leftSection={<mode.icon size={16} />}
                            onClick={() => {
                              onModeChange(mode.id);
                              setModePopoverOpened(false);
                            }}
                            fullWidth
                          >
                            <Stack gap={0} align="flex-start">
                              <Text>{mode.label}</Text>
                              <Text size="xs" c="dimmed">{mode.description}</Text>
                            </Stack>
                          </Button>
                        ))}
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                </Group>
              </Box>
            </Group>

            <Group gap="sm">
              <Box visibleFrom="md">
                <Group gap="sm">
                  <Tooltip label="Progress Stats">
                    <Link to="/statistics">
                      <ActionIcon 
                        variant="subtle" 
                        color="blue" 
                        size="lg"
                        style={headerStyles.actionButton}
                      >
                        <IconChartBar style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                      </ActionIcon>
                    </Link>
                  </Tooltip>

                  <Tooltip label="Chat History">
                    <ActionIcon 
                      variant="subtle" 
                      color="blue" 
                      size="lg"
                      style={headerStyles.actionButton}
                    >
                      <IconHistory style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      size="lg"
                      onClick={toggleColorScheme}
                      style={headerStyles.actionButton}
                    >
                      {colorScheme === 'dark' ? (
                        <IconSun style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                      ) : (
                        <IconMoon style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                      )}
                    </ActionIcon>
                  </Tooltip>

                  {showSettings && (
                    <Tooltip label="Settings">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="lg"
                        style={headerStyles.actionButton}
                        onClick={() => setSettingsOpened(true)}
                      >
                        <IconSettings style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Box>

              <Box hiddenFrom="md">
                <MobileMenu />
              </Box>

              <SignedIn>
                <UserButton 
                  afterSignOutUrl={window.location.origin}
                  appearance={{
                    elements: {
                        avatarBox: {
                          width: rem(32),
                          height: rem(32),
                        }
                      }
                    }}
                  />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    size="lg"
                    style={headerStyles.actionButton}
                  >
                    <IconBrain style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                  </ActionIcon>
                </SignInButton>
              </SignedOut>
            </Group>
          </div>
        </Container>
      </div>

      <SettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
        onResetAPIKey={onResetAPIKey}
      />
    </>
  );
};
