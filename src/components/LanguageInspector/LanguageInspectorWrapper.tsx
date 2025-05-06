import React from 'react';
import { LanguageInspector } from './LanguageInspector';
import { WordInfo } from '../../services/languageService';
import { useVocabulary } from '../../hooks/useVocabulary';
import { Notification } from '@mantine/core';
import { IconBookmark } from '@tabler/icons-react';

interface LanguageInspectorWrapperProps {
  children: React.ReactNode;
  targetLanguage?: string;
  nativeLanguage?: string;
  enableVocabulary?: boolean;
}

export const LanguageInspectorWrapper: React.FC<LanguageInspectorWrapperProps> = ({
  children,
  targetLanguage = 'Spanish',
  nativeLanguage = 'English',
  enableVocabulary = true
}) => {
  const { saveWord, recentlyAdded } = useVocabulary();

  const handleSaveToVocabulary = (wordInfo: WordInfo) => {
    saveWord(wordInfo, targetLanguage);
  };

  return (
    <>
      <LanguageInspector
        targetLanguage={targetLanguage}
        nativeLanguage={nativeLanguage}
        onSaveToVocabulary={enableVocabulary ? handleSaveToVocabulary : undefined}
      >
        {children}
      </LanguageInspector>
      
      {recentlyAdded && (
        <Notification
          icon={<IconBookmark size={18} />}
          color="teal"
          title="Word Saved"
          withCloseButton={false}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          {`"${recentlyAdded}" added to your vocabulary!`}
        </Notification>
      )}
    </>
  );
}; 