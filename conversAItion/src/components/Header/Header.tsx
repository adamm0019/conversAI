import React from 'react';
import {
  Group,
  ActionIcon,
  Tooltip,
  Container,
  rem,
  useMantineColorScheme,
  Menu,
  Box,
  Button,
  Popover,
  Stack,
  Text,
  Center,
  RingProgress,
} from '@mantine/core';
import {
  IconBrain,
  IconSettings,
  IconHistory,
  IconMenu2,
  IconRobot,
  IconBooks,
  IconSchool,
  IconFriends,
  IconDeviceGamepad2,
  IconLayoutDashboard,
  IconFlame,
  IconMessageCircle,
  IconLanguage,
} from '@tabler/icons-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { headerStyles } from './styles';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { StreakNotification } from '../Streak/StreakNotification';
import { useStreak } from '../../hooks/useStreak';
import darkModeLogo from '../../../src/assets/conversationlogodarkmode.png';
import lightModeLogo from '../../../src/assets/conversationlogolightmode.svg';
import { motion } from 'framer-motion';

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
    label: 'Tutor',
  },
  {
    id: 'friend',
    icon: IconFriends,
    label: 'Chat',
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
  const { streakData, showNotification, hideNotification } = useStreak();

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const Logo = () => (
      <Link to="/">
        <Group gap={4} style={{ userSelect: 'none' }}>
          <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
          >
            <Group gap={2} align="center">
              <Text
                  component="span"
                  style={{
                    fontSize: rem(24),
                    fontWeight: 800,
                    color: '#64b5f6',
                    letterSpacing: '0.2px',
                    position: 'relative',
                    paddingRight: rem(2),
                  }}
              >
                Convers
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    style={{ display: 'inline-block', position: 'relative' }}
                >
                  <Text
                      component="span"
                      style={{
                        color: '#64b5f6',
                        fontSize: rem(22),
                        fontWeight: 900,
                        letterSpacing: '-0.5px',
                        marginLeft: rem(1),
                      }}
                  >
                    AI
                  </Text>
                  <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      style={{
                        position: 'absolute',
                        top: rem(-8),
                        right: rem(-12),
                        transform: 'rotate(-15deg)',
                      }}
                  >
                    <IconLanguage
                        size={28}
                        style={{ color: '#64b5f6', opacity: 0.9, paddingLeft: rem(5) }}
                    />
                  </motion.div>
                </motion.div>
              </Text>
            </Group>
          </motion.div>
        </Group>
      </Link>
  );

  const selectedModeInfo = conversationModes.find((mode) => mode.id === selectedMode);
  const ModeIcon = selectedModeInfo?.icon || IconRobot;

  const StreakDisplay = () => {
    const [isHovered, setIsHovered] = React.useState(false);
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <Popover
            opened={isHovered}
            position="bottom"
            width={400}
            shadow="md"
            withArrow
            onClose={() => setIsHovered(false)}
        >
          <Popover.Target>
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
              <Group m="xs" style={{ cursor: 'pointer' }}>
                <RingProgress
                    size={40}
                    thickness={3}
                    sections={[{ value: (streakData.currentStreak / 7) * 100, color: '#64b5f6' }]}
                    label={
                      <Center>
                        <IconFlame size={20} color="#64b5f6" />
                      </Center>
                    }
                />
                <motion.div
                    key={streakData.currentStreak}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                  <Text size="sm" fw={500} c="dimmed">
                    {streakData.currentStreak}
                  </Text>
                </motion.div>
              </Group>
            </motion.div>
          </Popover.Target>
          <Popover.Dropdown
              style={{
                background: 'rgba(37, 38, 43, 0.75)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
          >
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Group p="md" m="apart" align="center">
                <Group>
                  <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <IconFlame size={24} color="#64b5f6" />
                  </motion.div>
                  <div>
                    <Text size="sm" fw={500}>
                      Current streak
                    </Text>
                    <motion.div
                        key={streakData.currentStreak}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                      <Text size="xl" c="#64b5f6">
                        {streakData.currentStreak} days
                      </Text>
                    </motion.div>
                  </div>
                </Group>

                <Group>
                  <IconFlame size={24} color="#64b5f6" style={{ opacity: 0.7 }} />
                  <div>
                    <Text size="sm" fw={500}>
                      Highest streak
                    </Text>
                    <Text size="xl" c="#64b5f6">
                      {streakData.highestStreak} days
                    </Text>
                  </div>
                </Group>

                <Group>
                  {days.map((day, index) => (
                      <motion.div
                          key={index}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                      >
                        <Stack m={4} align="center">
                          <motion.div
                              animate={{ scale: index < streakData.currentStreak ? [1, 1.1, 1] : 1 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <Box
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background:
                                      index < streakData.currentStreak
                                          ? '#64b5f6'
                                          : 'rgba(255, 255, 255, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                            />
                          </motion.div>
                          <Text size="xs" c="dimmed">
                            {day}
                          </Text>
                        </Stack>
                      </motion.div>
                  ))}
                </Group>
              </Group>
            </motion.div>
          </Popover.Dropdown>
        </Popover>
    );
  };

  const MobileMenu = () => (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="subtle" color="blue" size="lg" style={headerStyles.actionButton}>
            <IconMenu2 style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Stats</Menu.Label>
          <Box p="xs">
            <StreakDisplay />
          </Box>

          <Menu.Label>Conversation Modes</Menu.Label>
          {conversationModes.map((mode) => (
              <Menu.Item key={mode.id} leftSection={<mode.icon size={14} />} onClick={() => onModeChange(mode.id)}>
                {mode.label}
              </Menu.Item>
          ))}

          <Menu.Divider />

          <Menu.Label>Progress</Menu.Label>
          <Menu.Item leftSection={<IconDeviceGamepad2 size={14} />} component={Link} to="/games">
            Games
          </Menu.Item>

          <Menu.Item leftSection={<IconLayoutDashboard size={14} />} component={Link} to="/dashboard">
            Dashboard
          </Menu.Item>

          <Menu.Item leftSection={<IconHistory size={14} />}>History</Menu.Item>

          <Menu.Divider />

          {showSettings && (
              <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => setSettingsOpened(true)}>
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
                <Box visibleFrom="sm">
                  <Logo />
                </Box>
                <Box>
                  <Link to="/"></Link>
                </Box>

                <Box style={{ minWidth: '400px' }}>
                  <Group m="apart">
                    <Popover opened={modePopoverOpened} onChange={setModePopoverOpened} position="bottom" width={300}>
                      <Popover.Target>
                        <Button variant="light" leftSection={<ModeIcon size={16} />} onClick={() => setModePopoverOpened(true)}>
                          {selectedModeInfo?.label || 'Select Mode'}
                        </Button>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <Stack>
                          {conversationModes.map((mode) => (
                              <Button
                                  key={mode.id}
                                  leftSection={<mode.icon size={16} />}
                                  onClick={() => {
                                    onModeChange(mode.id);
                                    setModePopoverOpened(false);
                                  }}
                                  fullWidth
                              >
                                <Stack gap={1} align="flex-start">
                                  <Text>{mode.label}</Text>
                                </Stack>
                              </Button>
                          ))}
                        </Stack>
                      </Popover.Dropdown>
                    </Popover>
                    <StreakDisplay />
                  </Group>
                </Box>
              </Group>

              <Group gap="sm">
                <Box>
                  <Group gap="sm">
                    <Tooltip label="Language Games">
                      <Link to="/games">
                        <ActionIcon variant="subtle" color="blue" size="lg" style={headerStyles.actionButton}>
                          <IconDeviceGamepad2 style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                        </ActionIcon>
                      </Link>
                    </Tooltip>

                    <Tooltip label="Modules">
                      <Link to="/modules">
                        <ActionIcon variant="subtle" color="blue" size="lg" style={headerStyles.actionButton}>
                          <IconBooks style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                        </ActionIcon>
                      </Link>
                    </Tooltip>

                    <Tooltip label="Chat History">
                      <ActionIcon variant="subtle" color="blue" size="lg" style={headerStyles.actionButton}>
                        <IconHistory style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Dashboard">
                      <Link to="/dashboard">
                        <ActionIcon variant="subtle" color="blue" size="lg" style={headerStyles.actionButton}>
                          <IconLayoutDashboard style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                        </ActionIcon>
                      </Link>
                    </Tooltip>
                  </Group>
                </Box>

                <Box hiddenFrom="md">
                  <MobileMenu />
                </Box>

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

                <SignedIn>
                  <UserButton
                      afterSignOutUrl={window.location.origin}
                      appearance={{
                        elements: {
                          avatarBox: {
                            width: rem(32),
                            height: rem(32),
                          },
                        },
                      }}
                      userProfileMode="navigation"
                      userProfileUrl="/dashboard"
                  />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <ActionIcon variant="subtle" color="blue" size="lg" style={headerStyles.actionButton}>
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

        <StreakNotification streak={streakData.currentStreak} isVisible={showNotification} onHide={hideNotification} />
      </>
  );
};

export default Header;
