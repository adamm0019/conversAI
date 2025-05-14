import React, { useState, useEffect } from 'react';
import {
  Modal, Stack, Select, Switch, Group, Button, Text, Divider,
  useMantineTheme, useMantineColorScheme, Tabs, ScrollArea, Slider, Alert, ActionIcon, Title, Box, rem
} from '@mantine/core';
import {
  IconSettings, IconVolume, IconUserCog, IconPalette, IconLanguage,
  IconInfoCircle, IconAlertTriangle, IconTrash, IconMicrophone, IconHeadphones, IconPlayerPlay
} from '@tabler/icons-react';
import { useProfile } from '../../contexts/ProfileContext';
import { DynamicVariablesManager } from './DynamicVariablesManager';
import { notifications } from '@mantine/notifications';

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
  
}


const conversationModes = [
  { value: 'tutor', label: 'Tutor Mode' },
  { value: 'friend', label: 'Friend Mode (Casual Chat)' },
];

const interfaceLanguages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
  
];

const assistantPersonas = [
  { value: 'friendly', label: 'Friendly & Encouraging' },
  { value: 'formal', label: 'Formal & Structured' },
  { value: 'neutral', label: 'Neutral & Informative' },
  
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ opened, onClose }) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const { profile, updateProfileSettings, updateDynamicVariables } = useProfile();

  
  
  const [defaultMode, setDefaultMode] = useState(profile?.settings?.defaultMode || 'tutor');
  const [uiLanguage, setUiLanguage] = useState(profile?.settings?.uiLanguage || 'en');

  
  const [autoEndSentence, setAutoEndSentence] = useState(profile?.settings?.autoEndSentence ?? true);
  const [showTranscription, setShowTranscription] = useState(profile?.settings?.showTranscription ?? true);
  const [speechRate, setSpeechRate] = useState(profile?.settings?.speechRate || 1.0);
  const [assistantPersona, setAssistantPersona] = useState(profile?.settings?.assistantPersona || 'friendly');
  const [inputDevice, setInputDevice] = useState<string | null>(profile?.settings?.inputDevice || 'default');
  const [outputDevice, setOutputDevice] = useState<string | null>(profile?.settings?.outputDevice || 'default');
  const [availableInputDevices, setAvailableInputDevices] = useState<{ value: string, label: string }[]>([]);
  const [availableOutputDevices, setAvailableOutputDevices] = useState<{ value: string, label: string }[]>([]);

  
  const [clearHistoryConfirmOpen, setClearHistoryConfirmOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<string | null>('general');

  
  
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) {
          setAvailableInputDevices([{ value: 'default', label: 'Default Microphone' }]);
          setAvailableOutputDevices([{ value: 'default', label: 'Default Speakers' }]);
          return;
        }
        
        await navigator.mediaDevices.getUserMedia({ audio: true }); 

        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices
            .filter(device => device.kind === 'audioinput')
            .map(device => ({ value: device.deviceId, label: device.label || `Microphone ${availableInputDevices.length + 1}` }));
        const outputs = devices
            .filter(device => device.kind === 'audiooutput')
            .map(device => ({ value: device.deviceId, label: device.label || `Speakers ${availableOutputDevices.length + 1}` }));

        
        setAvailableInputDevices([{ value: 'default', label: 'Default Microphone' }, ...inputs]);
        setAvailableOutputDevices([{ value: 'default', label: 'Default Speakers' }, ...outputs]);

      } catch (err) {

        
        setAvailableInputDevices([{ value: 'default', label: 'Default Microphone' }]);
        setAvailableOutputDevices([{ value: 'default', label: 'Default Speakers' }]);
        notifications.show({
          title: 'Device Access Error',
          message: 'Could not list audio devices. Using defaults.',
          color: 'orange'
        });
      }
    };
    if (opened && activeTab === 'speech') { 
      fetchDevices();
    }
  }, [opened, activeTab]);

  
  const handleSettingChange = (setting: string, value: any) => {
    
    
    

    
    switch (setting) {
      case 'defaultMode': setDefaultMode(value); break;
      case 'uiLanguage': setUiLanguage(value); break;
      case 'autoEndSentence': setAutoEndSentence(value); break;
      case 'showTranscription': setShowTranscription(value); break;
      case 'speechRate': setSpeechRate(value); break;
      case 'assistantPersona': setAssistantPersona(value); break;
      case 'inputDevice': setInputDevice(value); break;
      case 'outputDevice': setOutputDevice(value); break;
    }
    
    if(updateProfileSettings) {
      updateProfileSettings({ [setting]: value });
    }
  };

  const handleDynamicVariablesUpdate = (variables: Record<string, any>) => {
    
    if (updateDynamicVariables) {
      updateDynamicVariables(variables);
      notifications.show({ message: 'Personalization updated', color: 'green' });
    }
  };

  const handleClearHistory = () => {
    
    
    setClearHistoryConfirmOpen(false); 
    onClose(); 
    notifications.show({ title: 'Chat History Cleared', message: 'Your conversation history has been removed.', color: 'green' });
  };

  
  const modalStyles = {
    overlay: { background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' },
    content: {
      background: colorScheme === 'dark' ? 'rgba(37, 38, 43, 0.85)' : 'rgba(255, 255, 255, 0.85)', 
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      boxShadow: theme.shadows.xl,
      borderRadius: theme.radius.lg,
    },
    header: {
      background: 'transparent', 
      borderBottom: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      paddingBottom: 'var(--mantine-spacing-sm)',
      marginBottom: 0, 
    },
    title: {
      fontWeight: 600,
      fontSize: theme.fontSizes.lg,
    },
    body: {
      paddingTop: 0, 
    }
  };

  return (
      <>
        <Modal
            opened={opened}
            onClose={onClose}
            title={
              <Group gap="xs">
                <IconSettings size={20} stroke={1.5} />
                <Title order={4}>Settings</Title>
              </Group>
            }
            size="lg"
            centered
            scrollAreaComponent={ScrollArea.Autosize}
            transitionProps={{ transition: 'pop', duration: 200 }}
            styles={modalStyles}
        >
          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
            <Tabs.List grow>
              <Tabs.Tab value="general" leftSection={<IconPalette size={16} stroke={1.5} />}>Appearance</Tabs.Tab>
              <Tabs.Tab value="speech" leftSection={<IconVolume size={16} stroke={1.5} />}>Speech & Audio</Tabs.Tab>
              <Tabs.Tab value="personalization" leftSection={<IconUserCog size={16} stroke={1.5} />}>Personalization</Tabs.Tab>
              <Tabs.Tab value="language" leftSection={<IconLanguage size={16} stroke={1.5} />}>Language</Tabs.Tab>
            </Tabs.List>

            <Box mt="xl">
              <Tabs.Panel value="general" pt="xs">
                <Stack gap="lg">
                  <SettingGroup title="Theme">
                    <Switch
                        label="Dark mode"
                        description="Toggle between light and dark theme"
                        checked={colorScheme === 'dark'}
                        onChange={(event) => setColorScheme(event.currentTarget.checked ? 'dark' : 'light')}
                        size="md"
                    />
                  </SettingGroup>

                  <Divider />

                  <SettingGroup title="Conversation Defaults">
                    <Select
                        label="Default Mode"
                        description="Choose the initial conversation mode"
                        data={conversationModes}
                        value={defaultMode}
                        onChange={(value) => handleSettingChange('defaultMode', value || 'tutor')}
                        allowDeselect={false}
                    />
                  </SettingGroup>

                  <Divider />

                  <SettingGroup title="Data Management">
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="sm" fw={500}>Clear Chat History</Text>
                        <Text size="xs" c="dimmed">Permanently delete all your conversations.</Text>
                      </div>
                      <Button
                          variant="outline"
                          color="red"
                          size="xs"
                          leftSection={<IconTrash size={14} stroke={1.5}/>}
                          onClick={() => setClearHistoryConfirmOpen(true)}
                      >
                        Clear History
                      </Button>
                    </Group>
                  </SettingGroup>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="speech" pt="xs">
                <Stack gap="lg">
                  <SettingGroup title="Voice Input">
                    <Select
                        label="Microphone"
                        description="Select your preferred input device"
                        data={availableInputDevices}
                        value={inputDevice}
                        onChange={(value) => handleSettingChange('inputDevice', value)}
                        leftSection={<IconMicrophone size={16} stroke={1.5}/>}
                        searchable
                        nothingFoundMessage="No devices found"
                    />
                    <Switch
                        label="Automatic sentence ending"
                        description="Detect when you pause speaking to end input"
                        checked={autoEndSentence}
                        onChange={(event) => handleSettingChange('autoEndSentence', event.currentTarget.checked)}
                        size="md"
                    />
                    <Switch
                        label="Show live transcription"
                        description="Display what the AI hears as you speak"
                        checked={showTranscription}
                        onChange={(event) => handleSettingChange('showTranscription', event.currentTarget.checked)}
                        size="md"
                    />
                  </SettingGroup>
                  <Divider />
                  <SettingGroup title="Voice Output">
                    <Select
                        label="Audio Output"
                        description="Select your preferred playback device"
                        data={availableOutputDevices}
                        value={outputDevice}
                        onChange={(value) => handleSettingChange('outputDevice', value)}
                        leftSection={<IconHeadphones size={16} stroke={1.5}/>}
                        searchable
                        nothingFoundMessage="No devices found"
                    />
                    <SettingItem label="Assistant Speech Rate">
                      <Slider
                          value={speechRate}
                          onChange={(value) => handleSettingChange('speechRate', value)}
                          min={0.5}
                          max={1.5}
                          step={0.1}
                          precision={1}
                          marks={[{ value: 1.0, label: 'Normal' }]}
                          label={(value) => `${value.toFixed(1)}x`}
                      />
                    </SettingItem>
                    <Select
                        label="Assistant Persona"
                        description="Choose the speaking style of the assistant"
                        data={assistantPersonas}
                        value={assistantPersona}
                        onChange={(value) => handleSettingChange('assistantPersona', value || 'friendly')}
                        allowDeselect={false}
                        leftSection={<IconPlayerPlay size={16} stroke={1.5}/>}
                    />
                  </SettingGroup>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="personalization" pt="xs">
                <SettingGroup title="User Information" description="This helps the AI tailor conversations to you. (Stored locally)">
                  <DynamicVariablesManager onUpdate={handleDynamicVariablesUpdate} />
                </SettingGroup>
              </Tabs.Panel>

              <Tabs.Panel value="language" pt="xs">
                <Stack gap="lg">
                  <SettingGroup title="Interface Language">
                    <Select
                        label="Display Language"
                        description="Change the language of the app interface"
                        data={interfaceLanguages}
                        value={uiLanguage}
                        onChange={(value) => handleSettingChange('uiLanguage', value || 'en')}
                        allowDeselect={false}
                    />
                  </SettingGroup>
                </Stack>
              </Tabs.Panel>
            </Box>

            <Group justify="flex-end" mt="xl" pt="md" style={{borderTop: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`}}>
              <Button variant="default" onClick={onClose}>
                Done
              </Button>
            </Group>
          </Tabs>
        </Modal>

        
        <Modal
            opened={clearHistoryConfirmOpen}
            onClose={() => setClearHistoryConfirmOpen(false)}
            title={
              <Group gap="xs" c="red">
                <IconAlertTriangle size={20} stroke={1.5} />
                <Title order={5}>Confirm Clear History</Title>
              </Group>
            }
            centered size="sm"
            overlayProps={{ backgroundOpacity: 0.7, blur: 5 }}
        >
          <Text size="sm" mb="lg">Are you sure you want to permanently delete all your chat history? This action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setClearHistoryConfirmOpen(false)}>Cancel</Button>
            <Button color="red" onClick={handleClearHistory}>Clear History</Button>
          </Group>
        </Modal>
      </>
  );
};


const SettingGroup: React.FC<{ title: string; description?: string; children: React.ReactNode }> =
    ({ title, description, children }) => (
        <Stack gap="xs">
          <Title order={5}>{title}</Title>
          {description && <Text size="xs" c="dimmed" mt={-4}>{description}</Text>}
          <Box pl="xs">{children}</Box>
        </Stack>
    );

const SettingItem: React.FC<{ label: string; children: React.ReactNode }> =
    ({ label, children }) => (
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="sm">{label}</Text>
          <Box style={{ flexBasis: '50%' }}>{children}</Box>
        </Group>
    );

export default SettingsModal;