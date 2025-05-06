import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { db } from '../lib/firebase/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DynamicVariables, sanitizeDynamicVariables } from '../types/dynamicVariables';

export interface UserLanguageProgress {
    language: string;
    level: string;
    progress: number;
    lastPracticed: string; 
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
    joinedAt: string; 
    targetLanguages: UserLanguageProgress[];
    preferences: {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        speechRecognition: boolean;
        aiVoice: string;
        dailyGoal: number; 
    };
    
    dynamicVariables: {
        user_name: string;
        subscription_tier: string;
        language_level: string;
        target_language: string;
        days_streak: number;
        vocabulary_mastered: number;
        grammar_mastered: number;
        total_progress: number;
        custom_greeting?: string;
        learning_style?: string;
        feedback_style?: string;
        difficulty_preference?: string;
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
    },
    dynamicVariables: {
        user_name: 'there',
        subscription_tier: 'free',
        language_level: 'beginner',
        target_language: 'Spanish',
        days_streak: 0,
        vocabulary_mastered: 0,
        grammar_mastered: 0,
        total_progress: 0,
        custom_greeting: 'Welcome to your language learning journey',
        learning_style: 'conversational',
        feedback_style: 'encouraging',
        difficulty_preference: 'balanced'
    }
};

export interface UseUserProfileReturn {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    loadProfile: () => Promise<UserProfile | null>;
    updateProfile: (updates: Partial<Omit<UserProfile, 'id'>>) => Promise<boolean>;
    updateLanguageProgress: (language: string, updates: Partial<UserLanguageProgress>) => Promise<boolean>;
    updateDynamicVariables: (updates: Partial<DynamicVariables>) => Promise<boolean>;
    changeTargetLanguage: (language: string) => Promise<boolean>;
    getDynamicVariables: () => DynamicVariables;
}

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

    // Load profile from Firebase
    const loadProfile = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            setError('User is not authenticated');
            return null;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Get user profile from Firestore
            const userProfileRef = doc(db, 'user_profiles', userId);
            const userProfileDoc = await getDoc(userProfileRef);
            
            if (!userProfileDoc.exists()) {
                // Create a new profile if it doesn't exist
                const newProfile = createDefaultProfile();
                
                // Convert to Firestore-compatible format
                const profileData = {
                    email: newProfile.email || '',
                    firstName: newProfile.firstName || '',
                    lastName: newProfile.lastName || '',
                    displayName: newProfile.displayName,
                    subscriptionTier: newProfile.subscriptionTier,
                    joinedAt: serverTimestamp(),
                    targetLanguages: newProfile.targetLanguages,
                    preferences: newProfile.preferences,
                    dynamicVariables: newProfile.dynamicVariables,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                };
                
                await setDoc(userProfileRef, profileData);
                
                setProfile(newProfile);
                return newProfile;
            }
            
            // Profile exists, load it
            const profileData = userProfileDoc.data();
            
            const userProfile: UserProfile = {
                id: userId,
                email: profileData.email || '',
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                displayName: profileData.displayName || 'User',
                subscriptionTier: profileData.subscriptionTier || 'free',
                joinedAt: profileData.joinedAt ? profileData.joinedAt.toDate().toISOString() : new Date().toISOString(),
                targetLanguages: profileData.targetLanguages || DEFAULT_PROFILE.targetLanguages,
                preferences: profileData.preferences || DEFAULT_PROFILE.preferences,
                dynamicVariables: profileData.dynamicVariables || DEFAULT_PROFILE.dynamicVariables
            };
            
            setProfile(userProfile);
            return userProfile;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
            setError(errorMessage);
            console.error('Error loading user profile:', error);
            
            // Try to load from localStorage as fallback
            try {
                const localStorageProfile = localStorage.getItem(`userProfile-${userId}`);
                if (localStorageProfile) {
                    const parsedProfile = JSON.parse(localStorageProfile) as UserProfile;
                    setProfile(parsedProfile);
                    return parsedProfile;
                }
            } catch (e) {
                console.error('Failed to load profile from localStorage:', e);
            }
            
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userId, createDefaultProfile]);

    // Update profile in Firebase
    const updateProfile = useCallback(async (
        updates: Partial<Omit<UserProfile, 'id'>>
    ) => {
        if (!userId || !profile) {
            setError('User is not authenticated or profile not loaded');
            return false;
        }

        try {
            const userProfileRef = doc(db, 'user_profiles', userId);
            
            // Prepare update data
            const updateData = {
                ...updates,
                updated_at: serverTimestamp()
            };
            
            await updateDoc(userProfileRef, updateData);
            
            // Update local state
            const updatedProfile = { ...profile, ...updates };
            setProfile(updatedProfile);
            
            // Update localStorage backup
            localStorage.setItem(`userProfile-${userId}`, JSON.stringify(updatedProfile));
            
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
        if (!profile) return false;
        
        try {
            const langIndex = profile.targetLanguages.findIndex(
                lang => lang.language.toLowerCase() === language.toLowerCase()
            );
            
            let updatedTargetLanguages;
            
            if (langIndex === -1) {
                // Language not found, add it
                const newLang: UserLanguageProgress = {
                    language,
                    level: updates.level || 'beginner',
                    progress: updates.progress || 0,
                    lastPracticed: updates.lastPracticed || new Date().toISOString(),
                    streak: updates.streak || 0,
                    vocabulary: updates.vocabulary || {
                        learned: 0,
                        mastered: 0,
                        totalAvailable: 1000
                    },
                    grammar: updates.grammar || {
                        learned: 0,
                        mastered: 0,
                        totalAvailable: 50
                    }
                };
                
                updatedTargetLanguages = [...profile.targetLanguages, newLang];
            } else {
                // Update existing language
                updatedTargetLanguages = [...profile.targetLanguages];
                updatedTargetLanguages[langIndex] = {
                    ...updatedTargetLanguages[langIndex],
                    ...updates
                };
            }
            
            // Update dynamic variables if the language being updated is the target language
            let dynamicVariables = { ...profile.dynamicVariables };
            const targetLangIndex = updatedTargetLanguages.findIndex(
                lang => lang.language.toLowerCase() === profile.dynamicVariables.target_language.toLowerCase()
            );
            
            if (targetLangIndex !== -1) {
                const targetLang = updatedTargetLanguages[targetLangIndex];
                dynamicVariables = {
                    ...dynamicVariables,
                    language_level: targetLang.level,
                    days_streak: targetLang.streak,
                    vocabulary_mastered: targetLang.vocabulary.mastered,
                    grammar_mastered: targetLang.grammar.mastered,
                    total_progress: targetLang.progress
                };
            }
            
            // Update the profile
            return await updateProfile({
                targetLanguages: updatedTargetLanguages,
                dynamicVariables
            });
        } catch (error) {
            console.error('Error updating language progress:', error);
            return false;
        }
    }, [profile, updateProfile]);

    // Update dynamic variables
    const updateDynamicVariables = useCallback(async (
        updates: Partial<DynamicVariables>
    ) => {
        if (!profile) return false;
        
        try {
            // Sanitize incoming variables
            const sanitizedUpdates = sanitizeDynamicVariables(updates);
            
            // Update profile
            return await updateProfile({
                dynamicVariables: {
                    ...profile.dynamicVariables,
                    ...sanitizedUpdates
                }
            });
        } catch (error) {
            console.error('Error updating dynamic variables:', error);
            return false;
        }
    }, [profile, updateProfile]);

    // Change target language
    const changeTargetLanguage = useCallback(async (
        language: string
    ) => {
        if (!profile) return false;
        
        try {
            // Check if language exists in target languages
            const langIndex = profile.targetLanguages.findIndex(
                lang => lang.language.toLowerCase() === language.toLowerCase()
            );
            
            if (langIndex === -1) {
                // Add new language
                const newLang: UserLanguageProgress = {
                    language,
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
                };
                
                const updatedTargetLanguages = [...profile.targetLanguages, newLang];
                
                // Update dynamic variables
                const dynamicVariables = {
                    ...profile.dynamicVariables,
                    target_language: language,
                    language_level: 'beginner'
                };
                
                return await updateProfile({
                    targetLanguages: updatedTargetLanguages,
                    dynamicVariables
                });
            } else {
                // Language already exists, just update dynamic variables
                const selectedLang = profile.targetLanguages[langIndex];
                
                const dynamicVariables = {
                    ...profile.dynamicVariables,
                    target_language: language,
                    language_level: selectedLang.level,
                    days_streak: selectedLang.streak,
                    vocabulary_mastered: selectedLang.vocabulary.mastered,
                    grammar_mastered: selectedLang.grammar.mastered,
                    total_progress: selectedLang.progress
                };
                
                return await updateProfile({
                    dynamicVariables
                });
            }
        } catch (error) {
            console.error('Error changing target language:', error);
            return false;
        }
    }, [profile, updateProfile]);

    // Load profile on initial mount
    useEffect(() => {
        if (userId && !profile && !isLoading) {
            loadProfile();
        }
    }, [userId, profile, isLoading, loadProfile]);

    // Get dynamic variables (needed for ProfileContext)
    const getDynamicVariables = useCallback((): DynamicVariables => {
        if (!profile) {
            return {
                user_name: 'there',
                subscription_tier: 'free',
                language_level: 'beginner',
                target_language: 'Spanish',
                days_streak: 0,
                vocabulary_mastered: 0,
                grammar_mastered: 0,
                total_progress: 0
            };
        }
        return profile.dynamicVariables;
    }, [profile]);

    return {
        profile,
        isLoading,
        error,
        loadProfile,
        updateProfile,
        updateLanguageProgress,
        updateDynamicVariables,
        changeTargetLanguage,
        getDynamicVariables
    };
};