// src/contexts/ProfileContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useUserProfile, UserProfile, UserLanguageProgress, UserSettings, UseUserProfileReturn } from '../services/UserProfileService'; // Verify path, ensure UserSettings is exported/imported
import { DynamicVariables } from '../types/dynamicVariables'; // Verify path
import { Timestamp } from 'firebase/firestore';

// Define the context type, ensuring it matches UseUserProfileReturn
// No need to redefine everything, just use the imported hook's return type
export type ProfileContextType = UseUserProfileReturn;

// Create the context
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const profileService = useUserProfile(); // Hook provides the full value

    return (
        <ProfileContext.Provider value={profileService}>
            {children}
        </ProfileContext.Provider>
    );
};

// Custom hook to use the profile context
export const useProfile = (): ProfileContextType => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};

// Optional helper hook (remains the same)
export const useDynamicVariables = (): DynamicVariables => {
    const { getDynamicVariables } = useProfile();
    return getDynamicVariables();
};