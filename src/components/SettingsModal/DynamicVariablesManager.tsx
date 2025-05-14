import React, { useState, useEffect } from 'react';
import {
    Box,
    Title,
    Text,
    TextInput,
    NumberInput,
    Select,
    Button,
    Group,
    Paper,
    Divider,
    Alert,
    Tabs,
} from '@mantine/core';
import { IconInfoCircle, IconDeviceFloppy, IconRefresh } from '@tabler/icons-react';
import { useProfile } from '../../contexts/ProfileContext';
import { notifications } from '@mantine/notifications';
import { DynamicVariables } from '../../types/dynamicVariables';

interface DynamicVariablesManagerProps {
    onUpdate?: (variables: DynamicVariables) => void;
}

export const DynamicVariablesManager: React.FC<DynamicVariablesManagerProps> = ({ onUpdate }) => {
    const { profile, getDynamicVariables, updateDynamicVariables, syncLanguageProgress } = useProfile();
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('basic');

    useEffect(() => {
        if (profile) {
            const currentVars = profile.dynamicVariables || {};
            setFormValues(currentVars);
        }
    }, [profile]);

    const handleInputChange = (field: string, value: any) => {
        setFormValues((prev) => ({
            ...prev,
            [field]: value,
        }));
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            const success = await updateDynamicVariables(formValues);
            if (success) {
                notifications.show({
                    title: 'Variables Updated',
                    message: 'Your personalization settings have been saved.',
                    color: 'green',
                });
                if (onUpdate) {
                    onUpdate(formValues as DynamicVariables);
                }
                setIsEditing(false);
            } else {
                throw new Error('Failed to update variables');
            }
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to save your personalization settings.',
                color: 'red',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSync = async () => {
        setIsSaving(true);
        try {
            const success = await syncLanguageProgress();
            if (success) {
                if (profile?.dynamicVariables) {
                    setFormValues(profile.dynamicVariables);
                }
                notifications.show({
                    title: 'Variables Synced',
                    message: 'Language progress has been synchronized.',
                    color: 'blue',
                });
                setIsEditing(false);
            }
        } catch (error) {
            notifications.show({
                title: 'Sync Error',
                message: 'Failed to synchronize language progress.',
                color: 'red',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (profile?.dynamicVariables) {
            setFormValues(profile.dynamicVariables);
            setIsEditing(false);
        }
    };

    if (!profile) {
        return (
            <Alert color="blue" title="Loading Profile">
                Your profile is being loaded. Please wait...
            </Alert>
        );
    }

    return (
        <>
            <Title order={3} mb="md">Conversation Personalization</Title>
            <Text c="dimmed" size="sm" mb="lg">
                Customize how the AI responds to you by adjusting these variables. These settings will be applied to your
                language learning conversations.
            </Text>
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                    <Tabs.Tab value="basic">Basic Information</Tabs.Tab>
                    <Tabs.Tab value="learning">Learning Preferences</Tabs.Tab>
                    <Tabs.Tab value="custom">Custom Variables</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="basic">
                    <Paper p="md" radius="md" withBorder>
                        <Group grow align="flex-start" mb="md">
                            <TextInput
                                label="Your Name"
                                description="How the AI will address you"
                                value={formValues.user_name || ''}
                                onChange={(e) => handleInputChange('user_name', e.target.value)}/>
                            <Select
                                label="Target Language"
                                description="Language you're learning"
                                value={formValues.target_language || ''}
                                onChange={(value) => handleInputChange('target_language', value)}
                                data={[
                                    {value: 'Spanish', label: 'Spanish'},
                                    {value: 'French', label: 'French'},
                                    {value: 'German', label: 'German'},
                                    {value: 'Italian', label: 'Italian'},
                                    {value: 'Japanese', label: 'Japanese'},
                                    {value: 'Chinese', label: 'Chinese'},
                                    {value: 'Russian', label: 'Russian'},
                                ]}/>
                        </Group>

                        <Group grow mb="md">
                            <Select
                                label="Proficiency Level"
                                description="Your current skill level"
                                value={formValues.language_level || ''}
                                onChange={(value) => handleInputChange('language_level', value)}
                                data={[
                                    {value: 'beginner', label: 'Beginner'},
                                    {value: 'elementary', label: 'Elementary'},
                                    {value: 'intermediate', label: 'Intermediate'},
                                    {value: 'advanced', label: 'Advanced'},
                                    {value: 'fluent', label: 'Fluent'},
                                ]}/>

                            <Select
                                label="Subscription Tier"
                                description="Your membership level"
                                value={formValues.subscription_tier || ''}
                                onChange={(value) => handleInputChange('subscription_tier', value)}
                                data={[
                                    {value: 'free', label: 'Free'},
                                    {value: 'standard', label: 'Standard'},
                                    {value: 'premium', label: 'Premium'},
                                ]}/>
                        </Group>

                        <Group grow>
                            <NumberInput
                                label="Learning Streak"
                                description="Days of consecutive practice"
                                value={formValues.days_streak || 0}
                                onChange={(value) => handleInputChange('days_streak', value)}
                                min={0}
                                max={365}/>

                            <NumberInput
                                label="Overall Progress"
                                description="Progress percentage in current language"
                                value={formValues.total_progress || 0}
                                onChange={(value) => handleInputChange('total_progress', value)}
                                min={0}
                                max={100}
                                suffix="%"/>
                        </Group>
                    </Paper>
                </Tabs.Panel>

                <Tabs.Panel value="learning">
                    <Paper p="md" radius="md" withBorder>
                        <Group grow mb="md">
                            <NumberInput
                                label="Vocabulary Mastered"
                                description="Number of words you've mastered"
                                value={formValues.vocabulary_mastered || 0}
                                onChange={(value) => handleInputChange('vocabulary_mastered', value)}
                                min={0}
                                max={10000}/>

                            <NumberInput
                                label="Grammar Concepts Mastered"
                                description="Number of grammar rules you've learned"
                                value={formValues.grammar_mastered || 0}
                                onChange={(value) => handleInputChange('grammar_mastered', value)}
                                min={0}
                                max={100}/>
                        </Group>

                        <Group grow mb="md">
                            <Select
                                label="Learning Style"
                                description="How you prefer to learn"
                                value={formValues.learning_style || ''}
                                onChange={(value) => handleInputChange('learning_style', value)}
                                data={[
                                    {value: 'conversational', label: 'Conversational'},
                                    {value: 'structured', label: 'Structured Lessons'},
                                    {value: 'immersive', label: 'Immersive'},
                                    {value: 'grammar-focused', label: 'Grammar-Focused'},
                                    {value: 'vocabulary-focused', label: 'Vocabulary-Focused'},
                                ]}/>

                            <Select
                                label="Feedback Style"
                                description="How you prefer to receive corrections"
                                value={formValues.feedback_style || ''}
                                onChange={(value) => handleInputChange('feedback_style', value)}
                                data={[
                                    {value: 'encouraging', label: 'Encouraging'},
                                    {value: 'direct', label: 'Direct'},
                                    {value: 'detailed', label: 'Detailed'},
                                    {value: 'minimal', label: 'Minimal'},
                                    {value: 'after-completion', label: 'After Completion'},
                                ]}/>
                        </Group>

                        <Select
                            label="Difficulty Preference"
                            description="How challenging you want the content to be"
                            value={formValues.difficulty_preference || ''}
                            onChange={(value) => handleInputChange('difficulty_preference', value)}
                            data={[
                                {value: 'easier', label: 'Easier Than My Level'},
                                {value: 'balanced', label: 'Balanced For My Level'},
                                {value: 'challenging', label: 'Challenging For My Level'},
                                {value: 'very-challenging', label: 'Very Challenging'},
                            ]}/>
                    </Paper>
                </Tabs.Panel>

                <Tabs.Panel value="custom">
                    <Paper p="md" radius="md" withBorder>
                        <Alert icon={<IconInfoCircle size={16}/>} title="Custom Variables" color="blue" mb="md">
                            These variables can be used to further personalize your AI assistant's behavior.
                        </Alert>

                        <TextInput
                            label="Custom Greeting"
                            description="A personalized greeting for your sessions"
                            value={formValues.custom_greeting || ''}
                            onChange={(e) => handleInputChange('custom_greeting', e.target.value)}
                            placeholder="Welcome to your language learning journey"
                            mb="md"/>

                        <Divider my="md" label="Add More Variables" labelPosition="center"/>

                        <Text size="sm" c="dimmed" mb="md">
                            You can add more custom variables by modifying your profile settings.
                        </Text>
                    </Paper>
                </Tabs.Panel>
            </Tabs>
            <Group mt="xl" justify="apart">
                <Group>
                    <Button
                        variant="light"
                        color="blue"
                        leftSection={<IconRefresh size={16}/>}
                        onClick={handleSync}
                        loading={isSaving}
                    >
                        Sync with Progress
                    </Button>

                    <Button
                        variant="subtle"
                        color="gray"
                        onClick={handleReset}
                        disabled={!isEditing || isSaving}
                    >
                        Reset
                    </Button>
                </Group>

                <Button
                    color="primary"
                    leftSection={<IconDeviceFloppy size={16}/>}
                    onClick={handleSave}
                    disabled={!isEditing}
                    loading={isSaving}
                >
                    Save Changes
                </Button>
            </Group>
        </>
    );
};

export default DynamicVariablesManager;