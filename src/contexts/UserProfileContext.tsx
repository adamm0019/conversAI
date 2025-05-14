import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { useAuth } from './AuthContext';


export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'fluent';


export interface LanguageProgress {
  proficiencyLevel: ProficiencyLevel;
  experiencePoints: number;
  wordsLearned: number;
  lessonsCompleted: number;
  lastActiveDate: string;
}


export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: string;
  lastActive: string;
  isOnboarded?: boolean;
  userPreferences?: {
    motivation?: string;
    feedbackStyle?: string;
  };
  streak: {
    currentStreak: number;
    highestStreak: number;
    lastInteractionDate: string;
  };
  languages: {
    [key: string]: LanguageProgress;
  };
  settings: {
    preferredLanguage: string;
    dailyGoal: number;
    notifications: boolean;
  };
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateLanguageProgress: (
    language: string,
    progress: Partial<LanguageProgress>
  ) => Promise<void>;
  incrementExperiencePoints: (language: string, points: number) => Promise<void>;
  getCurrentLanguageProgress: (language: string) => LanguageProgress | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);


  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);


    const userRef = doc(db, 'user_profiles', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          setUserProfile(docSnapshot.data() as UserProfile);
        } else {

          const today = new Date().toISOString().split('T')[0];
          const newProfile: UserProfile = {
            userId: user.uid,
            displayName: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL,
            createdAt: today,
            lastActive: today,
            isOnboarded: false,
            streak: {
              currentStreak: 0,
              highestStreak: 0,
              lastInteractionDate: today,
            },
            languages: {},
            settings: {
              preferredLanguage: 'spanish',
              dailyGoal: 10,
              notifications: true,
            },
          };

          try {
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create user profile'));
          }
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);


  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    try {
      const userRef = doc(db, 'user_profiles', user.uid);
      await updateDoc(userRef, { ...data, lastActive: new Date().toISOString().split('T')[0] });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update user profile'));
      throw err;
    }
  };


  const updateLanguageProgress = async (
    language: string,
    progress: Partial<LanguageProgress>
  ) => {
    if (!user || !userProfile) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = doc(db, 'user_profiles', user.uid);


      const currentProgress = userProfile.languages[language] || {
        proficiencyLevel: 'beginner',
        experiencePoints: 0,
        wordsLearned: 0,
        lessonsCompleted: 0,
        lastActiveDate: today,
      };


      const updatedProgress = {
        ...currentProgress,
        ...progress,
        lastActiveDate: today,
      };


      const updates: any = {
        [`languages.${language}`]: updatedProgress,
        lastActive: today,
      };

      await updateDoc(userRef, updates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update language progress'));
      throw err;
    }
  };


  const incrementExperiencePoints = async (language: string, points: number) => {
    if (!user || !userProfile) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = doc(db, 'user_profiles', user.uid);


      const currentProgress = userProfile.languages[language] || {
        proficiencyLevel: 'beginner',
        experiencePoints: 0,
        wordsLearned: 0,
        lessonsCompleted: 0,
        lastActiveDate: today,
      };


      const newXP = currentProgress.experiencePoints + points;


      let newLevel = currentProgress.proficiencyLevel;
      if (newXP >= 1000 && newLevel === 'beginner') {
        newLevel = 'intermediate';
      } else if (newXP >= 3000 && newLevel === 'intermediate') {
        newLevel = 'advanced';
      } else if (newXP >= 6000 && newLevel === 'advanced') {
        newLevel = 'fluent';
      }


      const updatedProgress = {
        ...currentProgress,
        experiencePoints: newXP,
        proficiencyLevel: newLevel,
        lastActiveDate: today,
      };


      const updates: any = {
        [`languages.${language}`]: updatedProgress,
        lastActive: today,
      };


      const daysDiff = calculateDaysBetween(userProfile.streak.lastInteractionDate, today);
      if (daysDiff === 1) {

        const newStreak = userProfile.streak.currentStreak + 1;
        updates.streak = {
          currentStreak: newStreak,
          highestStreak: Math.max(userProfile.streak.highestStreak, newStreak),
          lastInteractionDate: today,
        };
      } else if (daysDiff > 1) {

        updates.streak = {
          currentStreak: 1,
          highestStreak: userProfile.streak.highestStreak,
          lastInteractionDate: today,
        };
      } else if (daysDiff === 0 && userProfile.streak.lastInteractionDate !== today) {

        updates.streak = {
          ...userProfile.streak,
          lastInteractionDate: today,
        };
      }

      await updateDoc(userRef, updates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update experience points'));
      throw err;
    }
  };


  const getCurrentLanguageProgress = (language: string): LanguageProgress | null => {
    if (!userProfile || !userProfile.languages[language]) return null;
    return userProfile.languages[language];
  };


  const calculateDaysBetween = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const contextValue: UserProfileContextType = {
    userProfile,
    isLoading,
    error,
    updateUserProfile,
    updateLanguageProgress,
    incrementExperiencePoints,
    getCurrentLanguageProgress,
  };

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return {
    ...context,
    updateUserProfile: context.updateUserProfile,
    updateLanguageProgress: context.updateLanguageProgress,
    incrementExperiencePoints: context.incrementExperiencePoints,
    getCurrentLanguageProgress: context.getCurrentLanguageProgress,
  };
} 