import React from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Switch,
  Group,
  Button,
  Text,
  Divider,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
  onResetAPIKey: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  opened,
  onClose,
  onResetAPIKey,
}) => {
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  
  const [voiceModel, setVoiceModel] = React.useState('alloy');
  const [transcriptionModel, setTranscriptionModel] = React.useState('whisper-1');
  const [autoEndSentence, setAutoEndSentence] = React.useState(true);
  const [showTranscription, setShowTranscription] = React.useState(true);

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Settings" 
      size="md"
      styles={{
        header: {
          backgroundColor: theme.colors.dark[7],
        },
        content: {
          backgroundColor: theme.colors.dark[7],
        },
      }}
    >
      <Stack>
        <Text size="sm" fw={500} c="dimmed">Appearance</Text>
        <Switch
          label="Dark mode"
          checked={colorScheme === 'dark'}
          onChange={(event) => setColorScheme(event.currentTarget.checked ? 'dark' : 'light')}
          description="Toggle between light and dark theme"
        />

        <Divider my="sm" />

        <Text size="sm" fw={500} c="dimmed">API Configuration</Text>
        <Group justify="space-between">
          <Text size="sm">OpenAI API Key</Text>
          <Button variant="light" onClick={onResetAPIKey}>
            Reset API Key
          </Button>
        </Group>

        <Divider my="sm" />
        
        <Text size="sm" fw={500} c="dimmed">Voice Settings</Text>
        <Select
          label="Assistant Voice"
          value={voiceModel}
          onChange={(value) => setVoiceModel(value || 'alloy')}
          data={[
            { value: 'alloy', label: 'Alloy' },
            { value: 'echo', label: 'Echo' },
            { value: 'fable', label: 'Fable' },
            { value: 'onyx', label: 'Onyx' },
            { value: 'nova', label: 'Nova' },
            { value: 'shimmer', label: 'Shimmer' },
          ]}
        />

        <Select
          label="Transcription Model"
          value={transcriptionModel}
          onChange={(value) => setTranscriptionModel(value || 'whisper-1')}
          data={[
            { value: 'whisper-1', label: 'Whisper v1' },
          ]}
        />

        <Divider my="sm" />

        <Text size="sm" fw={500} c="dimmed">Conversation Settings</Text>
        <Switch
          label="Auto-end sentence detection"
          description="Automatically detect when you've finished speaking"
          checked={autoEndSentence}
          onChange={(event) => setAutoEndSentence(event.currentTarget.checked)}
        />

        <Switch
          label="Show transcription"
          description="Display real-time transcription of your speech"
          checked={showTranscription}
          onChange={(event) => setShowTranscription(event.currentTarget.checked)}
        />
      </Stack>
    </Modal>
  );
};
