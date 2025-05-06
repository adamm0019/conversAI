import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { WordInfo } from '../services/languageService';

// Interface for vocabulary items with additional metadata
export interface VocabularyItem extends WordInfo {
  savedAt: number;
  reviewCount: number;
  lastReviewed?: number;
  language: string;
}

/**
 * Custom hook for managing vocabulary
 */
export function useVocabulary() {
  // Store saved vocabulary in local storage
  const [vocabulary, setVocabulary] = useLocalStorage<VocabularyItem[]>({
    key: 'language-inspector-vocabulary',
    defaultValue: [],
  });

  // Keep track of recently added words to provide feedback
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  // Clear the recently added notification after 3 seconds
  useEffect(() => {
    if (recentlyAdded) {
      const timer = setTimeout(() => {
        setRecentlyAdded(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [recentlyAdded]);

  /**
   * Add or update a word in the vocabulary
   */
  const saveWord = useCallback((wordInfo: WordInfo, language: string = 'Spanish') => {
    setVocabulary(prev => {
      // Check if word already exists
      const existingIndex = prev.findIndex(
        item => item.word.toLowerCase() === wordInfo.word.toLowerCase() && 
                item.language.toLowerCase() === language.toLowerCase()
      );

      // Set as recently added for feedback
      setRecentlyAdded(wordInfo.word);

      if (existingIndex >= 0) {
        // Word exists, update it
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
        // Add new word
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

  /**
   * Remove a word from vocabulary
   */
  const removeWord = useCallback((word: string, language: string = 'Spanish') => {
    setVocabulary(prev => 
      prev.filter(item => 
        !(item.word.toLowerCase() === word.toLowerCase() && 
          item.language.toLowerCase() === language.toLowerCase())
      )
    );
  }, [setVocabulary]);

  /**
   * Check if a word exists in the vocabulary
   */
  const hasWord = useCallback((word: string, language: string = 'Spanish') => {
    return vocabulary.some(item => 
      item.word.toLowerCase() === word.toLowerCase() && 
      item.language.toLowerCase() === language.toLowerCase()
    );
  }, [vocabulary]);

  /**
   * Get words for a specific language
   */
  const getWordsByLanguage = useCallback((language: string) => {
    return vocabulary.filter(
      item => item.language.toLowerCase() === language.toLowerCase()
    );
  }, [vocabulary]);

  /**
   * Get words that need review (have not been reviewed in X days)
   */
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