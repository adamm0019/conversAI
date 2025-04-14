// src/services/UserProfileService.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { DynamicVariables, sanitizeDynamicVariables } from '../types/dynamicVariables';

export interface UserLanguageProgress {
    language: string;
    level: string;
    progress: number;
    lastPracticed: string; // ISO date string
    streak: number;
    vocabulary: {
        learned: number;
        mastered: number;
        totalAvailable: number;
    };
    grammar: {
        learned: number;
        mastered: number;
        totalAvailable: number;
    };
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    subscriptionTier: 'free' | 'standard' | 'premium';
    joinedAt: string; // ISO date string
    targetLanguages: UserLanguageProgress[];
    preferences: {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        speechRecognition: boolean;
        aiVoice: string;
        dailyGoal: number; // minutes
    };
}

const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'email' | 'firstName' | 'lastName'> = {
    displayName: '',
    subscriptionTier: 'free',
    joinedAt: new Date().toISOString(),
    targetLanguages: [
        {
            language: 'Spanish',
            level: 'beginner',
            progress: 0,
            lastPracticed: new Date().toISOString(),
            streak: 0,
            vocabulary: {
                learned: 0,
                mastered: 0,
                totalAvailable: 1000
            },
            grammar: {
                learned: 0,
                mastered: 0,
                totalAvailable: 50
            }
        }
    ],
    preferences: {
        theme: 'dark',
        notifications: true,
        speechRecognition: true,
        aiVoice: 'alloy',
        dailyGoal: 15
    }
};

export const useUserProfile = () => {
    const { userId } = useAuth();
    const { user } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const createDefaultProfile = useCallback((): UserProfile => {
        if (!userId || !user) {
            throw new Error('User is not authenticated');
        }

        return {
            id: userId,
            email: user.primaryEmailAddress?.emailAddress || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            ...DEFAULT_PROFILE,
            displayName: user.firstName || 'Student',
        };
    }, [userId, user]);

    // Load or create user profile
    const loadProfile = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            setError('User is not authenticated');
            return null;
        }

        try {
            setIsLoading(true);
            setError(null);

            const userDocRef = doc(db, 'userProfiles', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // Profile exists, return it
                const profileData = userDoc.data() as UserProfile;
                setProfile(profileData);
                return profileData;
            } else {
                // Create a new profile
                const newProfile = createDefaultProfile();
                await setDoc(userDocRef, newProfile);
                setProfile(newProfile);
                return newProfile;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
            setError(errorMessage);
            console.error('Error loading user profile:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userId, createDefaultProfile]);

    // Subscribe to profile changes
    useEffect(() => {
        if (!userId) return;

        const userDocRef = doc(db, 'userProfiles', userId);

        const unsubscribe = onSnapshot(
            userDocRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                }
                setIsLoading(false);
            },
            (error) => {
                console.error('Error in profile subscription:', error);
                setError('Failed to subscribe to profile updates');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    // Load profile on mount
    useEffect(() => {
        if (userId && !profile) {
            loadProfile();
        }
    }, [userId, profile, loadProfile]);

    // Update profile fields
    const updateProfile = useCallback(async (
        updates: Partial<Omit<UserProfile, 'id'>>
    ) => {
        if (!userId || !profile) {
            setError('User is not authenticated or profile not loaded');
            return false;
        }

        try {
            const userDocRef = doc(db, 'userProfiles', userId);
            await updateDoc(userDocRef, updates);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
            setError(errorMessage);
            console.error('Error updating user profile:', error);
            return false;
        }
    }, [userId, profile]);

    // Update language progress
    const updateLanguageProgress = useCallback(async (
        language: string,
        updates: Partial<UserLanguageProgress>
    ) => {
        if (!userId || !profile) {
            setError('User is not authenticated or profile not loaded');
            return false;
        }

        try {
            // Find the target language index
            const langIndex = profile.targetLanguages.findIndex(
                lang => lang.language.toLowerCase() === language.toLowerCase()
            );

            if (langIndex === -1) {
                // Language not found, create a new one
                const newLang: UserLanguageProgress = {
                    language,
                    level: 'beginner',
                    progress: 0,
                    lastPracticed: new Date().toISOString(),
                    streak: 0,
                    vocabulary: { learned: 0, mastered: 0, totalAvailable: 1000 },
                    grammar: { learned: 0, mastered: 0, totalAvailable: 50 },
                    ...updates
                };

                const updatedTargetLanguages = [...profile.targetLanguages, newLang];
                await updateProfile({ targetLanguages: updatedTargetLanguages });
            } else {
                // Update existing language
                const updatedLanguages = [...profile.targetLanguages];
                updatedLanguages[langIndex] = {
                    ...updatedLanguages[langIndex],
                    ...updates,
                    lastPracticed: new Date().toISOString() // Always update last practiced
                };

                await updateProfile({ targetLanguages: updatedLanguages });
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update language progress';
            setError(errorMessage);
            console.error('Error updating language progress:', error);
            return false;
        }
    }, [userId, profile, updateProfile]);

    // Get language progress
    const getLanguageProgress = useCallback((language: string): UserLanguageProgress | null => {
        if (!profile) return null;

        const lang = profile.targetLanguages.find(
            l => l.language.toLowerCase() === language.toLowerCase()
        );

        return lang || null;
    }, [profile]);

    // Get active language (most recently practiced)
    const getActiveLanguage = useCallback((): UserLanguageProgress | null => {
        if (!profile || profile.targetLanguages.length === 0) return null;

        // Sort by last practiced date (newest first)
        const sortedLanguages = [...profile.targetLanguages].sort((a, b) => {
            return new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime();
        });

        return sortedLanguages[0];
    }, [profile]);

    // Generate dynamic variables for 11labs with proper typing
    const getDynamicVariables = useCallback((): DynamicVariables => {
        if (!profile) {
            // Return default values if profile is not loaded
            return sanitizeDynamicVariables({
                user_name: 'there',
                subscription_tier: 'free',
                language_level: 'beginner',
                target_language: 'Spanish',
                days_streak: 0,
                vocabulary_mastered: 0,
                grammar_mastered: 0,
                total_progress: 0
            });
        }

        const activeLanguage = getActiveLanguage();

        const variables = {
            user_name: profile.firstName || profile.displayName || 'there',
            subscription_tier: profile.subscriptionTier || 'free',
            language_level: activeLanguage?.level || 'beginner',
            target_language: activeLanguage?.language || 'Spanish',
            days_streak: activeLanguage?.streak || 0,
            vocabulary_mastered: activeLanguage?.vocabulary.mastered || 0,
            grammar_mastered: activeLanguage?.grammar.mastered || 0,
            total_progress: activeLanguage?.progress || 0
        };

        // Sanitize to ensure no undefined values
        return sanitizeDynamicVariables(variables);
    }, [profile, getActiveLanguage]);

    return {
        profile,
        isLoading,
        error,
        loadProfile,
        updateProfile,
        updateLanguageProgress,
        getLanguageProgress,
        getActiveLanguage,
        getDynamicVariables
    };
};