import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { DynamicVariables, sanitizeDynamicVariables } from '../types/dynamicVariables';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';


function createBrowserClient(supabaseAccessToken: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
        apikey: supabaseKey,
      },
    },
  });
}

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
    const { userId, getToken } = useAuth();
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

            const token = await getToken();
            
            if (!token) {
                throw new Error('Failed to get token');
            }

            const client = createBrowserClient(token);
            
            // First, let's check what columns actually exist in the table
            try {
                console.log('Checking user_profiles schema...');
                const { data: tableInfo, error: tableError } = await client
                    .from('user_profiles')
                    .select('*')
                    .limit(1);
                    
                if (!tableError && tableInfo) {
                    console.log('Available columns:', tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'No data');
                }
            } catch (schemaErr) {
                console.log('Could not check schema:', schemaErr);
            }
            
            
            // Try to get user profile from Supabase using the right syntax
            const { data: profileData, error: fetchError } = await client
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (fetchError) {
                
                if (fetchError.code === 'PGRST116') {
                    const newProfile = createDefaultProfile();
                    
                    try {
                        
                        // Simplified object with only basic fields that must exist
                        const { error: insertError } = await client
                            .from('user_profiles')
                            .insert({
                                user_id: userId,
                                email: newProfile.email || '',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            });
                        
                        if (insertError) {
                            console.error('Error inserting profile:', insertError);
                            throw insertError;
                        }
                        
                        setProfile(newProfile);
                        return newProfile;
                    } catch (insertErr) {
                        console.error('Failed to create user profile:', insertErr);
                        throw new Error('Failed to create user profile');
                    }
                } else {
                    throw fetchError;
                }
            }
            
            
            if (!profileData) {
                throw new Error('No profile data returned');
            }
            
            
            const dbProfile = profileData as any;
            
            // Create a profile with only guaranteed fields first
            const userProfile: UserProfile = {
                id: userId,
                email: dbProfile.email || '',
                firstName: '',
                lastName: '',
                displayName: 'User',
                subscriptionTier: 'free',
                joinedAt: dbProfile.created_at || new Date().toISOString(),
                targetLanguages: DEFAULT_PROFILE.targetLanguages,
                preferences: DEFAULT_PROFILE.preferences,
                dynamicVariables: DEFAULT_PROFILE.dynamicVariables
            };
            
            // Then conditionally add any fields that exist
            if (dbProfile.first_name) userProfile.firstName = dbProfile.first_name;
            if (dbProfile.last_name) userProfile.lastName = dbProfile.last_name;
            if (dbProfile.display_name) userProfile.displayName = dbProfile.display_name;
            if (dbProfile.subscription_tier) userProfile.subscriptionTier = dbProfile.subscription_tier;
            if (dbProfile.target_languages) userProfile.targetLanguages = dbProfile.target_languages;
            if (dbProfile.preferences) userProfile.preferences = dbProfile.preferences;
            if (dbProfile.dynamic_variables) userProfile.dynamicVariables = dbProfile.dynamic_variables;
            
            setProfile(userProfile);
            return userProfile;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
            setError(errorMessage);
            console.error('Error loading user profile:', error);
            
            
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
    }, [userId, getToken, createDefaultProfile]);

    
    useEffect(() => {
        if (!userId) return;

        loadProfile();
        
        
        const setupSubscription = async () => {
            const token = await getToken();
            
            if (!token) {
                console.error('Failed to get token for subscription');
                return null;
            }

            const client = createBrowserClient(token);
            
            try {
                const subscription = client
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
                                console.log('Profile updated from subscription event');
                                const profileData = payload.new as any;
                                
                                // Start with current profile to preserve client-side state
                                const updatedProfile = { ...profile } as UserProfile;
                                
                                // Update only fields that exist in the payload
                                if (profileData.email) updatedProfile.email = profileData.email;
                                if (profileData.first_name) updatedProfile.firstName = profileData.first_name;
                                if (profileData.last_name) updatedProfile.lastName = profileData.last_name;
                                if (profileData.display_name) updatedProfile.displayName = profileData.display_name;
                                if (profileData.subscription_tier) updatedProfile.subscriptionTier = profileData.subscription_tier;
                                if (profileData.target_languages) updatedProfile.targetLanguages = profileData.target_languages;
                                if (profileData.preferences) updatedProfile.preferences = profileData.preferences;
                                if (profileData.dynamic_variables) updatedProfile.dynamicVariables = profileData.dynamic_variables;
                                
                                setProfile(updatedProfile);
                            }
                        }
                    )
                    .subscribe((status) => {
                        console.log('Subscription status:', status);
                    });

                return subscription;
            } catch (err) {
                console.error('Error setting up subscription:', err);
                return null;
            }
        };

        const subscriptionPromise = setupSubscription();

        return () => {
            subscriptionPromise.then(subscription => {
                if (subscription) {
                    subscription.unsubscribe();
                }
            });
        };
    }, [userId, getToken]);

    
    const updateProfile = useCallback(async (
        updates: Partial<Omit<UserProfile, 'id'>>
    ) => {
        if (!userId || !profile) {
            setError('User is not authenticated or profile not loaded');
            return false;
        }

        try {
            const token = await getToken();
            
            if (!token) {
                throw new Error('Failed to get token');
            }

            const client = createBrowserClient(token);
            
            
            // Start with minimal updates that should work
            const supabaseUpdates: Record<string, any> = {
                updated_at: new Date().toISOString()
            };
            
            // Only include fields that are likely to exist in the schema
            if (updates.email) supabaseUpdates.email = updates.email;
            
            // These might not exist in the schema, only add if we have confirmation they exist
            try {
                // Get one record to check schema
                const { data, error } = await client
                    .from('user_profiles')
                    .select('*')
                    .limit(1);
                
                if (!error && data && data.length > 0) {
                    const schema = data[0];
                    console.log('Detected schema:', Object.keys(schema));
                    
                    // Only add fields that exist in the schema
                    if ('first_name' in schema && updates.firstName) 
                        supabaseUpdates.first_name = updates.firstName;
                    
                    if ('last_name' in schema && updates.lastName) 
                        supabaseUpdates.last_name = updates.lastName;
                    
                    if ('display_name' in schema && updates.displayName) 
                        supabaseUpdates.display_name = updates.displayName;
                    
                    if ('subscription_tier' in schema && updates.subscriptionTier) 
                        supabaseUpdates.subscription_tier = updates.subscriptionTier;
                    
                    if ('preferences' in schema && updates.preferences) 
                        supabaseUpdates.preferences = updates.preferences;
                    
                    if ('target_languages' in schema && updates.targetLanguages) 
                        supabaseUpdates.target_languages = updates.targetLanguages;
                    
                    if ('dynamic_variables' in schema && updates.dynamicVariables) 
                        supabaseUpdates.dynamic_variables = updates.dynamicVariables;
                }
            } catch (schemaErr) {
                console.warn('Could not verify schema before update:', schemaErr);
                // Continue with minimal updates
            }
            
            
            const { error } = await client
                .from('user_profiles')
                .update(supabaseUpdates)
                .eq('user_id', userId);
                
            if (error) {
                console.error('Error updating profile in Supabase:', error);
                throw error;
            }
            
            
            const updatedProfile = { ...profile, ...updates };
            localStorage.setItem(`userProfile-${userId}`, JSON.stringify(updatedProfile));
            
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
            setError(errorMessage);
            console.error('Error updating user profile:', error);
            return false;
        }
    }, [userId, profile, getToken]);

    
    const updateLanguageProgress = useCallback(async (
        language: string,
        updates: Partial<UserLanguageProgress>
    ) => {
        if (!userId || !profile) {
            setError('User is not authenticated or profile not loaded');
            return false;
        }

        try {
            
            const langIndex = profile.targetLanguages.findIndex(
                lang => lang.language.toLowerCase() === language.toLowerCase()
            );

            let updatedTargetLanguages;
            
            if (langIndex === -1) {
                
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