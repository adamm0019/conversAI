import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Popover, Text, Stack, Group, ActionIcon, Button,
  Box, Paper, useMantineColorScheme
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBookmark, IconX, IconVolume } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { WordInfo, languageService } from '../../services/languageService';

interface LanguageInspectorProps {
  children: React.ReactNode;
  targetLanguage?: string;
  nativeLanguage?: string;
  onSaveToVocabulary?: (word: WordInfo) => void;
}

export const LanguageInspector: React.FC<LanguageInspectorProps> = ({
  children,
  targetLanguage = 'Spanish',
  nativeLanguage = 'English',
  onSaveToVocabulary
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { colorScheme } = useMantineColorScheme();

  const handleWordLookup = useCallback(async (text: string) => {
    setIsLoading(true);
    try {
      const info = await languageService.getWordInfo(text, targetLanguage, nativeLanguage);
      setWordInfo(info);
    } catch (error) {

      setWordInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [targetLanguage, nativeLanguage]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setSelectedText(text);
      setPosition({ x: e.clientX, y: e.clientY });
      setIsOpen(true);
      
      handleWordLookup(text);
    }
  }, [handleWordLookup]);

  const handleLongPress = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.bottom 
      });
      setIsOpen(true);
      
      handleWordLookup(text);
    }
  }, [handleWordLookup]);

  const saveToVocabulary = useCallback(() => {
    if (wordInfo && onSaveToVocabulary) {
      onSaveToVocabulary(wordInfo);
      
    }
  }, [wordInfo, onSaveToVocabulary]);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleTouchStart = useCallback(() => {
    setTouchStartTime(Date.now());
    const timeout = setTimeout(handleLongPress, 500); 
    setTouchTimeout(timeout);
  }, [handleLongPress]);
  
  const handleTouchEnd = useCallback(() => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
    setTouchStartTime(null);
  }, [touchTimeout]);

  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y + 10}px`,
    transform: 'translateX(-50%)',
    zIndex: 9999,
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      {children}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{ duration: 0.2 }}
            style={popoverStyle}
          >
            <Paper
              p="md"
              shadow="md"
              radius="md"
              style={{
                background: colorScheme === 'dark' 
                  ? 'rgba(36, 36, 40, 0.85)' 
                  : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                minWidth: '280px',
                maxWidth: '320px',
              }}
            >
              <Group justify="apart" mb="xs">
                <Text fw={700} size="lg">{selectedText}</Text>
                <ActionIcon size="sm" onClick={() => setIsOpen(false)}>
                  <IconX size={16} />
                </ActionIcon>
              </Group>
              
              {isLoading ? (
                <Text size="sm" c="dimmed">Loading...</Text>
              ) : wordInfo ? (
                <Stack gap="xs">
                  <Group align="center" gap="xs">
                    <ActionIcon size="sm" variant="subtle">
                      <IconVolume size={16} />
                    </ActionIcon>
                    <Text size="xs" c="dimmed">{wordInfo.grammarRole}</Text>
                  </Group>
                  
                  <Text size="sm">{wordInfo.definition}</Text>
                  {wordInfo.nativeDefinition && (
                    <Text size="sm" c="dimmed">{wordInfo.nativeDefinition}</Text>
                  )}
                  
                  <Text size="sm" fw={500} mt="xs">Examples:</Text>
                  {wordInfo.examples.map((example, index) => (
                    <Text key={index} size="sm" style={{ fontStyle: 'italic' }}>
                      {example}
                    </Text>
                  ))}
                  
                  {onSaveToVocabulary && (
                    <Group justify="right" mt="xs">
                      <Button 
                        size="xs" 
                        variant="light" 
                        leftSection={<IconBookmark size={14} />}
                        onClick={saveToVocabulary}
                      >
                        Save to Vocabulary
                      </Button>
                    </Group>
                  )}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">No information available</Text>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 