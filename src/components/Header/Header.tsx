import React from 'react';
import {
    Group, ActionIcon, Tooltip, Container, rem, useMantineColorScheme,
    Menu, Box, Button, Popover, Stack, Text, Center, RingProgress, Image, AppShellHeader
} from '@mantine/core';
import {
    IconBrain, IconSettings, IconHistory, IconMenu2, IconRobot, IconBooks,
    IconSchool, IconFriends, IconDeviceGamepad2, IconLayoutDashboard, IconFlame,
    IconLanguage, IconSun, IconMoon, IconVocabulary
} from '@tabler/icons-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { StreakNotification } from '../Streak/StreakNotification';
import { useStreak } from '../../hooks/useStreak';
import darkModeLogo from '../../assets/conversai-logo-dark.png';
import lightModeLogo from '../../assets/conversai-logo.png';
import { motion } from 'framer-motion';

interface HeaderProps {
    selectedMode: string;
    onModeChange: (value: string) => void;
    onResetAPIKey?: () => void; 
    showSettings: boolean;
}

const conversationModes = [
    { id: 'tutor', icon: IconSchool, label: 'Tutor' },
    { id: 'friend', icon: IconFriends, label: 'Chat' },
];


const LogoComponent: React.FC = React.memo(() => {
    const { colorScheme } = useMantineColorScheme();
    return (
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <Image
                    src={colorScheme === 'dark' ? darkModeLogo : lightModeLogo}
                    alt="ConversAI Logo"
                    h={28}
                    w={160}
                    style={{ display: 'block' }}
                />
            </motion.div>
        </Link>
    );
});
LogoComponent.displayName = 'LogoComponent';


const StreakDisplay: React.FC = () => {
    const [isHovered, setIsHovered] = React.useState(false);
    const { streakData } = useStreak();

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
            <Popover.Dropdown
                style={{
                    background: 'rgba(var(--mantine-color-dark-7-rgb), 0.8)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--mantine-radius-md)',
                }}
            >
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Group p="md" justify="space-between" align="center">
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
                    </Group>
                </motion.div>
            </Popover.Dropdown>
        </Popover>
    );
};

export const Header: React.FC<HeaderProps> = ({
                                                  selectedMode,
                                                  onModeChange,
                                                  onResetAPIKey,
                                                  showSettings,
                                              }) => {
    const [settingsOpened, setSettingsOpened] = React.useState(false);
    const [modePopoverOpened, setModePopoverOpened] = React.useState(false);
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const { showNotification, hideNotification } = useStreak();

    const toggleColorScheme = () => {
        setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
    };

    const selectedModeInfo = conversationModes.find((mode) => mode.id === selectedMode);
    const ModeIcon = selectedModeInfo?.icon || IconRobot;

    const headerStyle: React.CSSProperties = {
        background: colorScheme === 'dark'
            ? 'rgba(26, 27, 30, 0.7)'
            : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        height: rem(60),
        paddingLeft: 'var(--mantine-spacing-md)',
        paddingRight: 'var(--mantine-spacing-md)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
    };

    const innerHeaderStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        maxWidth: '100%',
    };

    const MobileMenu = () => (
        <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="lg">
                    <IconMenu2 stroke={1.5} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                    <Menu.Item leftSection={<IconLayoutDashboard size={16} />}>
                        Dashboard
                    </Menu.Item>
                </Link>
                <Link to="/modules" style={{ textDecoration: 'none' }}>
                    <Menu.Item leftSection={<IconBooks size={16} />}>
                        Modules
                    </Menu.Item>
                </Link>
                <Link to="/games" style={{ textDecoration: 'none' }}>
                    <Menu.Item leftSection={<IconDeviceGamepad2 size={16} />}>
                        Language Games
                    </Menu.Item>
                </Link>
                <Link to="/language-inspector" style={{ textDecoration: 'none' }}>
                    <Menu.Item leftSection={<IconVocabulary size={16} />}>
                        Language Inspector
                    </Menu.Item>
                </Link>
                <Menu.Divider />
                {/* Other menu items */}
            </Menu.Dropdown>
        </Menu>
    );

    return (
        <>
            <Box style={headerStyle}>
                <div style={innerHeaderStyle}>
                    <Group gap="md" align="center">
                        <LogoComponent />
                        <Popover opened={modePopoverOpened} onChange={setModePopoverOpened} position="bottom-start" width={240} shadow="md">
                            <Popover.Target>
                                <Button
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<ModeIcon size={16} stroke={1.5} />}
                                    onClick={() => setModePopoverOpened((o) => !o)}
                                    size="sm"
                                >
                                    {selectedModeInfo?.label || 'Select Mode'}
                                </Button>
                            </Popover.Target>
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
                                            justify="start"
                                            size="sm"
                                        >
                                            {mode.label}
                                        </Button>
                                    ))}
                                </Stack>
                            </Popover.Dropdown>
                        </Popover>
                    </Group>

                    <Group gap="sm" align="center">
                        <Box visibleFrom="sm">
                            <Group gap="xs">
                                <StreakDisplay />
                                <Tooltip label="Dashboard" position="bottom">
                                    <Link to="/dashboard">
                                        <ActionIcon variant="subtle" color="gray" size="lg">
                                            <IconLayoutDashboard stroke={1.5} />
                                        </ActionIcon>
                                    </Link>
                                </Tooltip>
                                <Tooltip label="Modules" position="bottom">
                                    <Link to="/modules">
                                        <ActionIcon variant="subtle" color="gray" size="lg">
                                            <IconBooks stroke={1.5} />
                                        </ActionIcon>
                                    </Link>
                                </Tooltip>
                                <Tooltip label="Language Games" position="bottom">
                                    <Link to="/games">
                                        <ActionIcon variant="subtle" color="gray" size="lg">
                                            <IconDeviceGamepad2 stroke={1.5} />
                                        </ActionIcon>
                                    </Link>
                                </Tooltip>
                                <Tooltip label="Language Inspector" position="bottom">
                                    <Link to="/language-inspector">
                                        <ActionIcon variant="subtle" color="gray" size="lg">
                                            <IconVocabulary stroke={1.5} />
                                        </ActionIcon>
                                    </Link>
                                </Tooltip>
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
                                >
                                    <IconSettings stroke={1.5} />
                                </ActionIcon>
                            </Tooltip>
                        )}

                        <SignedIn>
                            <UserButton afterSignOutUrl={window.location.origin} />
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button variant="light" size="sm">Sign In</Button>
                            </SignInButton>
                        </SignedOut>

                        <Box hiddenFrom="sm">
                            <MobileMenu />
                        </Box>
                    </Group>
                </div>
            </Box>

            <SettingsModal
                opened={settingsOpened}
                onClose={() => setSettingsOpened(false)}
            />
            <StreakNotification streak={0} isVisible={false} onHide={() => {}} />
        </>
    );
};