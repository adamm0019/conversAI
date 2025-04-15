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
  Tabs,
  ScrollArea,
} from '@mantine/core';
import { DynamicVariablesManager } from './DynamicVariablesManager';
import { useProfile } from '../../contexts/ProfileContext';

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
  const { updateDynamicVariables } = useProfile();

  const [voiceModel, setVoiceModel] = React.useState('alloy');
  const [transcriptionModel, setTranscriptionModel] = React.useState('whisper-1');
  const [autoEndSentence, setAutoEndSentence] = React.useState(true);
  const [showTranscription, setShowTranscription] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string | null>('general');

  const handleDynamicVariablesUpdate = (variables: Record<string, any>) => {
    // Call the updateDynamicVariables function from ProfileContext
    updateDynamicVariables(variables);
  };

  return (
      <Modal
          opened={opened}
          onClose={onClose}
          title="Settings"
          size="lg"
          styles={{
            header: {
              backgroundColor: theme.colors.dark[7],
            },
            content: {
              backgroundColor: theme.colors.dark[7],
            },
          }}
      >
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="voice">Voice & Audio</Tabs.Tab>
            <Tabs.Tab value="variables">Personalization</Tabs.Tab>
            <Tabs.Tab value="api">API Settings</Tabs.Tab>
          </Tabs.List>

          <ScrollArea h={450} mt="md">
            <Tabs.Panel value="general">
              <Stack>
                <Text size="sm" fw={500} c="dimmed">
                  Appearance
                </Text>
                <Switch
                    label="Dark mode"
                    checked={colorScheme === 'dark'}
                    onChange={(event) =>
                        setColorScheme(event.currentTarget.checked ? 'dark' : 'light')
                    }
                    description="Toggle between light and dark theme"
                />

                <Divider my="sm" />

                <Text size="sm" fw={500} c="dimmed">
                  Conversation Settings
                </Text>
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
            </Tabs.Panel>

            <Tabs.Panel value="voice">
              <Stack>
                <Text size="sm" fw={500} c="dimmed">
                  Voice Settings
                </Text>
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
                    data={[{ value: 'whisper-1', label: 'Whisper v1' }]}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="variables">
              <DynamicVariablesManager onUpdate={handleDynamicVariablesUpdate} />
            </Tabs.Panel>

            <Tabs.Panel value="api">
              <Stack>
                <Text size="sm" fw={500} c="dimmed">
                  API Configuration
                </Text>
                <Group justify="space-between">
                  <Text size="sm">OpenAI API Key</Text>
                  <Button variant="light" onClick={onResetAPIKey}>
                    Reset API Key
                  </Button>
                </Group>

                <Divider my="sm" />

                <Text size="sm" fw={500} c="dimmed">
                  ElevenLabs Settings
                </Text>
                <TextInput
                    label="ElevenLabs API Key"
                    placeholder="Enter your ElevenLabs API key"
                    description="Used for text-to-speech capabilities"
                />
                <Select
                    label="ElevenLabs Model"
                    data={[
                      { value: 'eleven_multilingual_v2', label: 'Multilingual v2' },
                      { value: 'eleven_monolingual_v1', label: 'Monolingual v1' },
                    ]}
                    defaultValue="eleven_multilingual_v2"
                />
              </Stack>
            </Tabs.Panel>
          </ScrollArea>

          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Tabs>
      </Modal>
  );
};
