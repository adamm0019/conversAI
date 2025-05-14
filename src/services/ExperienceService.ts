import { useUserProfile } from '../contexts/UserProfileContext';


export const XP_VALUES = {
  CONVERSATION_MESSAGE: 5,
  CONVERSATION_COMPLETION: 20,
  WORD_LEARNED: 10,
  LESSON_COMPLETED: 50,
  GAME_COMPLETION: 30,
  PERFECT_GAME_SCORE: 50,
  DAILY_STREAK: 15,
  PRONUNCIATION_PRACTICE: 8,
} as const;

export type ActivityType = keyof typeof XP_VALUES;

export interface ExperienceServiceType {
  awardExperiencePoints: (
    language: string,
    activity: ActivityType,
    multiplier?: number
  ) => Promise<void>;
  recordWordLearned: (language: string, word: string) => Promise<void>;
  recordLessonCompleted: (language: string, lessonId: string) => Promise<void>;
  getCurrentLevel: (language: string) => string | null;
  getCurrentXP: (language: string) => number | null;
}

export function useExperienceService(): ExperienceServiceType {
  const {
    userProfile,
    updateLanguageProgress,
    incrementExperiencePoints,
    getCurrentLanguageProgress
  } = useUserProfile();


  const awardExperiencePoints = async (
    language: string,
    activity: ActivityType,
    multiplier = 1
  ): Promise<void> => {
    if (!userProfile) return;

    const points = XP_VALUES[activity] * multiplier;
    await incrementExperiencePoints(language, points);
  };


  const recordWordLearned = async (language: string, word: string): Promise<void> => {
    if (!userProfile) return;

    const currentProgress = getCurrentLanguageProgress(language);
    if (!currentProgress) return;


    const currentWords = currentProgress.wordsLearned;


    await updateLanguageProgress(language, {
      wordsLearned: currentWords + 1
    });


    await awardExperiencePoints(language, 'WORD_LEARNED');
  };


  const recordLessonCompleted = async (language: string, lessonId: string): Promise<void> => {
    if (!userProfile) return;

    const currentProgress = getCurrentLanguageProgress(language);
    if (!currentProgress) return;


    await updateLanguageProgress(language, {
      lessonsCompleted: currentProgress.lessonsCompleted + 1
    });


    await awardExperiencePoints(language, 'LESSON_COMPLETED');
  };


  const getCurrentLevel = (language: string): string | null => {
    if (!userProfile) return null;

    const progress = getCurrentLanguageProgress(language);
    if (!progress) return null;

    return progress.proficiencyLevel;
  };


  const getCurrentXP = (language: string): number | null => {
    if (!userProfile) return null;

    const progress = getCurrentLanguageProgress(language);
    if (!progress) return null;

    return progress.experiencePoints;
  };

  return {
    awardExperiencePoints,
    recordWordLearned,
    recordLessonCompleted,
    getCurrentLevel,
    getCurrentXP
  };
} 