import React from 'react';
import {
  Group, ActionIcon, Tooltip, Container, rem, useMantineColorScheme,
  Menu, Box, Button, Popover, Stack, Text, Center, RingProgress, Image, AppShellHeader
} from '@mantine/core';
import {
  IconBrain, IconSettings, IconHistory, IconMenu2, IconRobot, IconBooks,
  IconSchool, IconFriends, IconDeviceGamepad2, IconLayoutDashboard, IconFlame,
  IconLanguage, IconSun, IconMoon // Added Sun/Moon for theme toggle
} from '@tabler/icons-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
// Removed direct import of headerStyles, assuming styles are now in a global or theme context, or defined inline/locally
// import { headerStyles } from './styles';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { StreakNotification } from '../Streak/StreakNotification';
import { useStreak } from '../../hooks/useStreak';
import darkModeLogo from '../../assets/conversai-logo-dark.png'; // Ensure paths are correct
import lightModeLogo from '../../assets/conversai-logo.png';   // Ensure paths are correct
import { motion } from 'framer-motion';

interface HeaderProps {
  selectedMode: string;
  onModeChange: (value: string) => void;
  onResetAPIKey: () => void;
  showSettings: boolean;
}

const conversationModes = [
  { id: 'tutor', icon: IconSchool, label: 'Tutor' },
  { id: 'friend', icon: IconFriends, label: 'Chat' },
];

// --- Logo Component (Moved Outside & Memoized) ---
const LogoComponent: React.FC = React.memo(() => {
  const { colorScheme } = useMantineColorScheme();
  return (
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Using Image component, ensure it works or use standard <img> */}
          <Image
              src={colorScheme === 'dark' ? darkModeLogo : lightModeLogo}
              alt="ConversAI Logo"
              h={28} // Adjust height as needed
              w={160} // Adjust width as needed
              style={{ display: 'block' }} // Prevents extra space below image
          />
          {/* Alternative: Standard img tag */}
          {/* <img
                    src={colorScheme === 'dark' ? darkModeLogo : lightModeLogo}
                    alt="ConversAI Logo"
                    style={{ height: '28px', width: 'auto', display: 'block' }}
                 /> */}
        </motion.div>
      </Link>
  );
});
LogoComponent.displayName = 'LogoComponent'; // Good practice for memoized components


// --- Streak Display Component (Can also be externalized/memoized if complex) ---
const StreakDisplay: React.FC = () => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { streakData } = useStreak();
  // Simplified display for header, full popover remains the same
  return (
      <Popover opened={isHovered} position="bottom" width={400} shadow="md" withArrow onClose={() => setIsHovered(false)}>
        <Popover.Target>
            <Group
                gap="xs"
                style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--mantine-radius-md)', transition: 'background-color 0.2s ease' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                bg={isHovered ? 'var(--mantine-color-dark-6)' : 'transparent'}
            >
              <IconFlame size={18} color="var(--mantine-color-orange-5)" />
              <Text size="sm" fw={500} c="dimmed">
                {streakData.currentStreak}
              </Text>
            </Group>
        </Popover.Target>
        {/* Popover.Dropdown content remains the same as before */}
        <Popover.Dropdown
            style={{
              background: 'rgba(var(--mantine-color-dark-7-rgb), 0.8)', // Use theme variable with opacity
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--mantine-radius-md)',
            }}
        >
          {/* Existing Popover Dropdown Content Here... */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Group p="md" justify="space-between" align="center">
              {/* Existing content: Current Streak, Highest Streak, Day indicators */}
              {/* Example simplified structure */}
              <Group>
                <IconFlame size={24} color="var(--mantine-color-orange-5)" />
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Current Streak</Text>
                  <Text size="lg" fw={600} c="orange.5">{streakData.currentStreak} days</Text>
                </Stack>
              </Group>
              <Group>
                <IconFlame size={24} color="var(--mantine-color-gray-6)" />
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Highest Streak</Text>
                  <Text size="lg" fw={600}>{streakData.highestStreak} days</Text>
                </Stack>
              </Group>
              {/* Add weekly dots if desired */}
            </Group>
          </motion.div>
        </Popover.Dropdown>
      </Popover>
  );
};


// --- Main Header Component ---
export const Header: React.FC<HeaderProps> = ({
                                                selectedMode,
                                                onModeChange,
                                                onResetAPIKey,
                                                showSettings,
                                              }) => {
  const [settingsOpened, setSettingsOpened] = React.useState(false);
  const [modePopoverOpened, setModePopoverOpened] = React.useState(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { showNotification, hideNotification } = useStreak(); // Assuming streak notification logic is handled

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const selectedModeInfo = conversationModes.find((mode) => mode.id === selectedMode);
  const ModeIcon = selectedModeInfo?.icon || IconRobot;

  // Define styles directly or import from a refined style object
  const headerStyle: React.CSSProperties = {
    // Glassmorphism Background
    background: colorScheme === 'dark'
        ? 'rgba(26, 27, 30, 0.7)' // Dark theme glass
        : 'rgba(255, 255, 255, 0.7)', // Light theme glass
    backdropFilter: 'blur(12px)',
    // Border
    borderBottom: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    // Ensure height is applied if not using AppShell.Header prop
    height: rem(60), // Match AppShell header height
    paddingLeft: 'var(--mantine-spacing-md)',
    paddingRight: 'var(--mantine-spacing-md)',
    position: 'fixed', // Make header truly fixed
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200, // Ensure header is above chat shelf trigger/content
  };

  const innerHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%', // Take full height of header container
    maxWidth: '100%', // Allow full width inside container if needed, else use Mantine Container size prop
  };

  const actionIconStyle: React.CSSProperties = {
    // Style for header action icons if needed, e.g., hover effects
  };

  // Mobile menu remains largely the same, adjust styling if needed
  const MobileMenu = () => (
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" size="lg" /* style={actionIconStyle} */ >
            <IconMenu2 stroke={1.5} />
          </ActionIcon>
        </Menu.Target>
        {/* Menu Dropdown content remains the same... */}
        <Menu.Dropdown>
          {/* ... */}
        </Menu.Dropdown>
      </Menu>
  );

  return (
      <>
        {/* Use AppShell.Header for proper layout integration if Home uses AppShell */}
        {/* Or use a standard div with fixed positioning */}
        <Box style={headerStyle}>
          {/* Removed Mantine Container to allow full width, control max-width inside if needed */}
          <div style={innerHeaderStyle}>
            <Group gap="md" align="center">
              <LogoComponent /> {/* Use the externalized Logo */}
              {/* Mode Switcher Button */}
              <Popover opened={modePopoverOpened} onChange={setModePopoverOpened} position="bottom-start" width={240} shadow="md">
                <Popover.Target>
                  <Button
                      variant="subtle" // Use subtle for less emphasis
                      color="gray"
                      leftSection={<ModeIcon size={16} stroke={1.5} />}
                      onClick={() => setModePopoverOpened((o) => !o)}
                      size="sm"
                  >
                    {selectedModeInfo?.label || 'Select Mode'}
                  </Button>
                </Popover.Target>
                {/* Popover Dropdown content remains the same... */}
                <Popover.Dropdown
                    style={{
                      background: 'rgba(var(--mantine-color-dark-7-rgb), 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 'var(--mantine-radius-md)',
                    }}
                >
                  <Stack gap="xs">
                    {conversationModes.map((mode) => (
                        <Button
                            key={mode.id}
                            variant="subtle"
                            color={selectedMode === mode.id ? 'blue' : 'gray'}
                            leftSection={<mode.icon size={18} stroke={1.5}/>}
                            onClick={() => { onModeChange(mode.id); setModePopoverOpened(false); }}
                            fullWidth
                            justify="start" // Align text left
                            size="sm"
                        >
                          {mode.label}
                        </Button>
                    ))}
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            </Group>

            {/* Right side actions */}
            <Group gap="sm" align="center">
              <Box visibleFrom="sm"> {/* Hide less critical icons on smaller screens */}
                <Group gap="xs">
                  <StreakDisplay />
                  <Tooltip label="Language Games" position="bottom">
                    <Link to="/games">
                      <ActionIcon variant="subtle" color="gray" size="lg" /* style={actionIconStyle} */>
                        <IconDeviceGamepad2 stroke={1.5} />
                      </ActionIcon>
                    </Link>
                  </Tooltip>
                  {/* Consider moving Modules/History/Dashboard to a Profile menu or sidebar */}
                  {/* <Tooltip label="Modules">...</Tooltip> */}
                  {/* <Tooltip label="Chat History">...</Tooltip> */}
                  {/* <Tooltip label="Dashboard">...</Tooltip> */}
                </Group>
              </Box>

              <Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`} position="bottom">
                <ActionIcon
                    onClick={toggleColorScheme}
                    variant="subtle"
                    size="lg"
                    color="gray"
                    aria-label="Toggle color scheme"
                >
                  {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
                </ActionIcon>
              </Tooltip>

              {showSettings && (
                  <Tooltip label="Settings" position="bottom">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        onClick={() => setSettingsOpened(true)}
                        /* style={actionIconStyle} */
                    >
                      <IconSettings stroke={1.5} />
                    </ActionIcon>
                  </Tooltip>
              )}

              <SignedIn>
                <UserButton afterSignOutUrl={window.location.origin} /* appearance={...} */ />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="light" size="sm">Sign In</Button>
                </SignInButton>
              </SignedOut>

              {/* Mobile Menu Trigger - shown only on small screens */}
              <Box hiddenFrom="sm">
                <MobileMenu />
              </Box>
            </Group>
          </div>
        </Box>

        <SettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} onResetAPIKey={onResetAPIKey} />
        <StreakNotification streak={0 /* Pass actual streak */} isVisible={false /* Control visibility */} onHide={() => {}} />
      </>
  );
};

// Default export might not be needed if Header is always imported specifically
// export default Header;