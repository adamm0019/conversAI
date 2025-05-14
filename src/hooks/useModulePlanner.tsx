import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export interface Module {
  id: string;
  title: string;
  description: string;
  progress: number;
  isLocked?: boolean;
  timeEstimate: string;
  level: string;
  type: 'vocabulary' | 'grammar' | 'conversation' | 'pronunciation';
  xpValue: number;
}

export interface UserLearningProfile {
  proficiency: string;
  targetLanguage: string;
  goal: string;
  streak: number;
  motivation: string;
}

export function useModulePlanner() {
  const [modules, setModules] = useState<Module[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<{ text: string, reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const userProfile: UserLearningProfile = {
    proficiency: 'B1',
    targetLanguage: 'Spanish',
    goal: 'Conversational fluency',
    streak: 7,
    motivation: 'Travel'
  };

  const fetchPersonalizedModules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/ai-modules', {
        profile: userProfile,
        userId: currentUser?.uid
      });

      setModules(response.data.modules);
      setAiSuggestions(response.data.suggestions);
      setLoading(false);
    } catch (err) {

      setError('Failed to load your personalized learning path');
      setLoading(false);


      setModules([
        {
          id: 'vocab-builder',
          title: 'Vocabulary Builder',
          description: 'Expand your Spanish word bank with targeted practice',
          progress: 60,
          timeEstimate: '15-mins',
          level: 'intermediate',
          type: 'vocabulary',
          xpValue: 100
        },
        {
          id: 'everyday-conversations',
          title: 'Everyday Conversations',
          description: 'Practice common dialogues for daily interactions',
          progress: 80,
          timeEstimate: '15-20 min',
          level: 'intermediate',
          type: 'conversation',
          xpValue: 150
        },
        {
          id: 'complex-sentences',
          title: 'Complex Sentences',
          description: 'Master advanced sentence structures and expressions',
          progress: 0,
          isLocked: true,
          timeEstimate: '25-30 min',
          level: 'intermediate',
          type: 'grammar',
          xpValue: 200
        }
      ]);

      setAiSuggestions([
        {
          text: 'Complete "Vocabulary Builder" to unlock new content',
          reason: 'Building core vocabulary is essential for your conversational goals'
        },
        {
          text: 'Practice past tense to improve your storytelling',
          reason: 'Your grammar assessment shows this is an area for improvement'
        },
        {
          text: 'Try the daily pronunciation challenge',
          reason: 'Consistent practice will help with accent reduction'
        }
      ]);
    }
  }, [currentUser, userProfile]);

  const updateModuleProgress = useCallback(async (moduleId: string, progress: number, completed: boolean = false) => {
    try {

      setModules(prev => prev.map(mod =>
        mod.id === moduleId ? { ...mod, progress } : mod
      ));






      if (completed) {
        fetchPersonalizedModules();
      }
    } catch (err) {

    }
  }, [fetchPersonalizedModules]);

  const generateChallenge = useCallback(async () => {
    try {
      const response = await axios.post('/api/ai-challenge', {
        profile: userProfile,
        userId: currentUser?.uid
      });

      return response.data.challenge;
    } catch (err) {

      return {
        title: 'Weekend Description Challenge',
        description: 'Describe your weekend in Spanish using the past tense',
        difficulty: 'intermediate',
        xpReward: 100
      };
    }
  }, [currentUser, userProfile]);


  useEffect(() => {
    fetchPersonalizedModules();
  }, [fetchPersonalizedModules]);

  return {
    modules,
    aiSuggestions,
    loading,
    error,
    updateModuleProgress,
    generateChallenge,
    refreshModules: fetchPersonalizedModules,
    userProfile
  };
} 