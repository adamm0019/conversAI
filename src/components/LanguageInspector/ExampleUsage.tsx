import React from 'react';
import { Paper, Stack, Text, Title, Container, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { LanguageInspectorWrapper } from './LanguageInspectorWrapper';

/**
 * Example component demonstrating the Language Inspector functionality
 */
export const LanguageInspectorExample: React.FC = () => {
  return (
    <Container size="md" py="xl">
      <Title order={2} mb="lg">Language Inspector Demo</Title>
      
      <Alert 
        icon={<IconInfoCircle />} 
        title="How to use" 
        color="blue" 
        mb="lg"
      >
        Right-click (or long-press on mobile) on any word in the text below to see its definition, 
        grammar information, and examples. You can save words to your vocabulary for later review.
      </Alert>
      
      <Stack gap="xl">
        <Paper p="lg" withBorder>
          <Title order={3} mb="md">Spanish Example</Title>
          <LanguageInspectorWrapper targetLanguage="Spanish" nativeLanguage="English">
            <Text>
              Hola, ¿cómo estás? Me llamo Juan y soy de España. Me gusta mucho hablar español y 
              conocer a personas nuevas. Espero que estés disfrutando de tu día.
            </Text>
          </LanguageInspectorWrapper>
        </Paper>
        
        <Paper p="lg" withBorder>
          <Title order={3} mb="md">French Example</Title>
          <LanguageInspectorWrapper targetLanguage="French" nativeLanguage="English">
            <Text>
              Bonjour! Comment allez-vous? Je m'appelle Marie et je suis française. 
              J'habite à Paris depuis trois ans et j'adore cette ville.
            </Text>
          </LanguageInspectorWrapper>
        </Paper>
        
        <Paper p="lg" withBorder>
          <Title order={3} mb="md">English Example</Title>
          <LanguageInspectorWrapper targetLanguage="English" nativeLanguage="Spanish">
            <Text>
              Hello there! My name is Sarah. I'm an English teacher living in London. 
              I've been teaching English for five years now and I absolutely love it.
            </Text>
          </LanguageInspectorWrapper>
        </Paper>
      </Stack>
    </Container>
  );
}; 