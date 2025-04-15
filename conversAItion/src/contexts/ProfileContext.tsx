// src/contexts/ProfileContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useUserProfile, UserProfile, UserLanguageProgress } from '../services/UserProfileService';
import { DynamicVariables } from '../types/dynamicVariables';

type ProfileContextType = {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    loadProfile: () => Promise<UserProfile | null>;
    updateProfile: (updates: Partial<Omit<UserProfile, 'id'>>) => Promise<boolean>;
    updateLanguageProgress: (language: string, updates: Partial<UserLanguageProgress>) => Promise<boolean>;
    getLanguageProgress: (language: string) => UserLanguageProgress | null;
    getActiveLanguage: () => UserLanguageProgress | null;
    getDynamicVariables: () => DynamicVariables;
    updateDynamicVariables: (updates: Partial<UserProfile['dynamicVariables']>) => Promise<boolean>;
    syncLanguageProgress: () => Promise<boolean>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const profileService = useUserProfile();

    return (
        <ProfileContext.Provider value={profileService}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = (): ProfileContextType => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};

// Helper hook to get dynamic variables for ElevenLabs
export const useDynamicVariables = (): DynamicVariables => {
    const { getDynamicVariables } = useProfile();
    return getDynamicVariables();
};