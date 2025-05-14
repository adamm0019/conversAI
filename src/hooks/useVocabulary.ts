import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { WordInfo } from '../services/languageService';


export interface VocabularyItem extends WordInfo {
  savedAt: number;
  reviewCount: number;
  lastReviewed?: number;
  language: string;
}


export function useVocabulary() {

  const [vocabulary, setVocabulary] = useLocalStorage<VocabularyItem[]>({
    key: 'language-inspector-vocabulary',
    defaultValue: [],
  });


  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);


  useEffect(() => {
    if (recentlyAdded) {
      const timer = setTimeout(() => {
        setRecentlyAdded(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [recentlyAdded]);

  const saveWord = useCallback((wordInfo: WordInfo, language: string = 'Spanish') => {
    setVocabulary(prev => {

      const existingIndex = prev.findIndex(
        item => item.word.toLowerCase() === wordInfo.word.toLowerCase() &&
          item.language.toLowerCase() === language.toLowerCase()
      );


      setRecentlyAdded(wordInfo.word);

      if (existingIndex >= 0) {

        const updated = [...prev];
        updated[existingIndex] = {
          ...wordInfo,
          language,
          savedAt: prev[existingIndex].savedAt,
          reviewCount: prev[existingIndex].reviewCount + 1,
          lastReviewed: Date.now()
        };
        return updated;
      } else {

        return [
          ...prev,
          {
            ...wordInfo,
            language,
            savedAt: Date.now(),
            reviewCount: 0
          }
        ];
      }
    });

    return true;
  }, [setVocabulary]);


  const removeWord = useCallback((word: string, language: string = 'Spanish') => {
    setVocabulary(prev =>
      prev.filter(item =>
        !(item.word.toLowerCase() === word.toLowerCase() &&
          item.language.toLowerCase() === language.toLowerCase())
      )
    );
  }, [setVocabulary]);


  const hasWord = useCallback((word: string, language: string = 'Spanish') => {
    return vocabulary.some(item =>
      item.word.toLowerCase() === word.toLowerCase() &&
      item.language.toLowerCase() === language.toLowerCase()
    );
  }, [vocabulary]);


  const getWordsByLanguage = useCallback((language: string) => {
    return vocabulary.filter(
      item => item.language.toLowerCase() === language.toLowerCase()
    );
  }, [vocabulary]);


  const getWordsForReview = useCallback((daysThreshold: number = 7) => {
    const thresholdTime = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);

    return vocabulary.filter(item =>
      !item.lastReviewed || item.lastReviewed < thresholdTime
    );
  }, [vocabulary]);

  return {
    vocabulary,
    recentlyAdded,
    saveWord,
    removeWord,
    hasWord,
    getWordsByLanguage,
    getWordsForReview
  };
} 