import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase/supabaseClient';
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

    
    const loadProfile = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            setError('User is not authenticated');
            return null;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Try to get user profile from Supabase
            const { data: profileData, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (fetchError) {
                // If the profile doesn't exist, create a new one
                if (fetchError.code === 'PGRST116') {
                    const newProfile = createDefaultProfile();
                    
                    const { error: insertError } = await supabase
                        .from('user_profiles')
                        .insert({
                            user_id: userId,
                            email: newProfile.email,
                            first_name: newProfile.firstName,
                            last_name: newProfile.lastName,
                            display_name: newProfile.displayName,
                            subscription_tier: newProfile.subscriptionTier,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            preferences: newProfile.preferences,
                            target_languages: newProfile.targetLanguages,
                            dynamic_variables: newProfile.dynamicVariables
                        });
                    
                    if (insertError) {
                        throw insertError;
                    }
                    
                    setProfile(newProfile);
                    return newProfile;
                } else {
                    throw fetchError;
                }
            }
            
            // Map the Supabase data format to our UserProfile interface
            const userProfile: UserProfile = {
                id: userId,
                email: profileData.email || '',
                firstName: profileData.first_name || '',
                lastName: profileData.last_name || '',
                displayName: profileData.display_name || '',
                subscriptionTier: profileData.subscription_tier || 'free',
                joinedAt: profileData.created_at,
                targetLanguages: profileData.target_languages || DEFAULT_PROFILE.targetLanguages,
                preferences: profileData.preferences || DEFAULT_PROFILE.preferences,
                dynamicVariables: profileData.dynamic_variables || DEFAULT_PROFILE.dynamicVariables
            };
            
            setProfile(userProfile);
            return userProfile;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
            setError(errorMessage);
            console.error('Error loading user profile:', error);
            
            // Fallback to localStorage
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

    
    useEffect(() => {
        if (!userId) return;

        loadProfile();
        
        // Set up real-time subscription to profile changes
        const subscription = supabase
            .channel('user_profile_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'user_profiles',
                    filter: `user_id=eq.${userId}`
                }, 
                (payload) => {
                    if (payload.new) {
                        const profileData = payload.new;
                        
                        // Map to UserProfile format
                        const userProfile: UserProfile = {
                            id: userId,
                            email: profileData.email || '',
                            firstName: profileData.first_name || '',
                            lastName: profileData.last_name || '',
                            displayName: profileData.display_name || '',
                            subscriptionTier: profileData.subscription_tier || 'free',
                            joinedAt: profileData.created_at,
                            targetLanguages: profileData.target_languages || DEFAULT_PROFILE.targetLanguages,
                            preferences: profileData.preferences || DEFAULT_PROFILE.preferences,
                            dynamicVariables: profileData.dynamic_variables || DEFAULT_PROFILE.dynamicVariables
                        };
                        
                        setProfile(userProfile);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId, loadProfile]);

    
    const updateProfile = useCallback(async (
        updates: Partial<Omit<UserProfile, 'id'>>
    ) => {
        if (!userId || !profile) {
            setError('User is not authenticated or profile not loaded');
            return false;
        }

        try {
            // Transform to Supabase format
            const supabaseUpdates: Record<string, any> = {};
            
            if (updates.email) supabaseUpdates.email = updates.email;
            if (updates.firstName) supabaseUpdates.first_name = updates.firstName;
            if (updates.lastName) supabaseUpdates.last_name = updates.lastName;
            if (updates.displayName) supabaseUpdates.display_name = updates.displayName;
            if (updates.subscriptionTier) supabaseUpdates.subscription_tier = updates.subscriptionTier;
            if (updates.preferences) supabaseUpdates.preferences = updates.preferences;
            if (updates.targetLanguages) supabaseUpdates.target_languages = updates.targetLanguages;
            if (updates.dynamicVariables) supabaseUpdates.dynamic_variables = updates.dynamicVariables;
            
            supabaseUpdates.updated_at = new Date().toISOString();
            
            const { error } = await supabase
                .from('user_profiles')
                .update(supabaseUpdates)
                .eq('user_id', userId);
                
            if (error) {
                throw error;
            }
            
            // Also update localStorage as fallback
            const updatedProfile = { ...profile, ...updates };
            localStorage.setItem(`userProfile-${userId}`, JSON.stringify(updatedProfile));
            
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
            setError(errorMessage);
            console.error('Error updating user profile:', error);
            return false;
        }
    }, [userId, profile]);

    
    const updateLanguageProgress = useCallback(async (
        language: string,
        updates: Partial<UserLanguageProgress>
    ) => {
        if (!userId || !profile) {
            setError('User is not authenticated or profile not loaded');
            return false;
        }

        try {
            // Find the language in the current target languages
            const langIndex = profile.targetLanguages.findIndex(
                lang => lang.language.toLowerCase() === language.toLowerCase()
            );

            let updatedTargetLanguages;
            
            if (langIndex === -1) {
                // Create a new language entry
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

                updatedTargetLanguages = [...profile.targetLanguages, newLang];
            } else {
                // Update existing language entry
                updatedTargetLanguages = [...profile.targetLanguages];
                updatedTargetLanguages[langIndex] = {
                    ...updatedTargetLanguages[langIndex],
                    ...updates
                };
            }
            
            return await updateProfile({ targetLanguages: updatedTargetLanguages });
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update language progress';
            setError(errorMessage);
            console.error('Error updating language progress:', error);
            return false;
        }
    }, [userId, profile, updateProfile]);

    
    const updateDynamicVariables = useCallback(async (
        variables: Partial<DynamicVariables>
    ) => {
        if (!profile) return false;
        
        try {
            const sanitizedVars = sanitizeDynamicVariables(variables);
            const updatedVariables = {
                ...profile.dynamicVariables,
                ...sanitizedVars
            };
            
            return await updateProfile({
                dynamicVariables: updatedVariables
            });
        } catch (error) {
            console.error('Error updating dynamic variables:', error);
            return false;
        }
    }, [profile, updateProfile]);

    
    return {
        profile,
        isLoading,
        error,
        loadProfile,
        updateProfile,
        updateLanguageProgress,
        updateDynamicVariables
    };
};