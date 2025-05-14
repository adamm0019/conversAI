import React, { createContext, useContext, ReactNode } from 'react';
import { useUserProfile, UseUserProfileReturn } from '../services/UserProfileService';
import { DynamicVariables } from '../types/dynamicVariables';



export type ProfileContextType = UseUserProfileReturn;


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


export const useDynamicVariables = (): DynamicVariables => {
    const { getDynamicVariables } = useProfile();
    return getDynamicVariables();
};