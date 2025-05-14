import { useState } from 'react';
import { Menu, UnstyledButton, Group, Avatar, Text, rem, Badge } from '@mantine/core';
import { IconLogout, IconSettings, IconUser } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const [menuOpened, setMenuOpened] = useState(false);
  const { user, signOut } = useAuth();
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  
  const userInitial = user.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : user.email 
      ? user.email.charAt(0).toUpperCase() 
      : '?';

  
  const displayName = user.displayName || user.email || 'User';

  
  let activeBadge = null;
  if (userProfile && userProfile.settings && userProfile.languages) {
    const preferredLanguage = userProfile.settings.preferredLanguage;
    
    
    if (preferredLanguage && userProfile.languages[preferredLanguage]) {
      const langProgress = userProfile.languages[preferredLanguage];
      
      if (langProgress && langProgress.proficiencyLevel) {
        const level = langProgress.proficiencyLevel;
        const levelColor = {
          beginner: 'blue',
          intermediate: 'teal',
          advanced: 'violet',
          fluent: 'grape'
        }[level] || 'blue';
        
        activeBadge = (
          <Badge
            color={levelColor}
            size="xs"
            radius="sm"
            variant="filled"
          >
            {preferredLanguage.charAt(0).toUpperCase() + preferredLanguage.slice(1)} · {level.charAt(0).toUpperCase() + level.slice(1)}
          </Badge>
        );
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {

    }
  };

  return (
    <Menu
      width={200}
      position="bottom-end"
      opened={menuOpened}
      onChange={setMenuOpened}
    >
      <Menu.Target>
        <UnstyledButton>
          <Group gap={7}>
            <Avatar 
              radius="xl" 
              color="blue" 
              src={user.photoURL}
            >
              {userInitial}
            </Avatar>
            <div>
              <Text size="sm" fw={500}>
                {displayName}
              </Text>
              {activeBadge}
            </div>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item 
          leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
          onClick={() => navigate('/dashboard')}
        >
          Profile
        </Menu.Item>
        <Menu.Item 
          leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
          onClick={() => {}}
        >
          Settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item 
          leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
          onClick={handleSignOut}
          color="red"
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
} 