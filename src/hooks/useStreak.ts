import { useState, useCallback } from 'react';

interface StreakData {
    currentStreak: number;
    lastInteractionDate: string;
    highestStreak: number;
}

/**
 * Calculates the number of days between two dates
 */
const daysBetween = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Reset time portion for accurate day calculation
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    // Calculate the difference in milliseconds
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    // Convert to days
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const useStreak = () => {
    const [showNotification, setShowNotification] = useState(false);
    const [streakData, setStreakData] = useState<StreakData>(() => getInitialStreakData());

    function getInitialStreakData(): StreakData {
        const stored = localStorage.getItem('conversationStreak');
        if (stored) {
            return JSON.parse(stored);
        }
        const today = new Date().toISOString().split('T')[0];
        return {
            currentStreak: 0,
            lastInteractionDate: today,
            highestStreak: 0
        };
    }

    const getStreakFromStorage = useCallback((): StreakData => {
        const stored = localStorage.getItem('conversationStreak');
        if (stored) {
            return JSON.parse(stored);
        }
        return streakData;
    }, [streakData]);

    
    const updateStreak = useCallback(() => {
        const currentStreak = getStreakFromStorage();
        const today = new Date().toISOString().split('T')[0];

        // If already interacted today, don't update streak
        if (currentStreak.lastInteractionDate === today) {
            return currentStreak;
        }

        // Calculate days between last interaction and today
        const daysDiff = daysBetween(currentStreak.lastInteractionDate, today);
        
        let newStreak: StreakData;
        
        // If exactly one day has passed, increment the streak
        if (daysDiff === 1) {
            newStreak = {
                currentStreak: currentStreak.currentStreak + 1,
                lastInteractionDate: today,
                highestStreak: Math.max(currentStreak.highestStreak, currentStreak.currentStreak + 1)
            };
            setShowNotification(true);
        } 
        // If more than one day has passed, reset the streak
        else if (daysDiff > 1) {
            newStreak = {
                currentStreak: 1, // Start a new streak
                lastInteractionDate: today,
                highestStreak: currentStreak.highestStreak // Keep the highest streak record
            };
            setShowNotification(false);
        }
        // This handles any edge cases or potential timezone issues
        else {
            newStreak = {
                ...currentStreak,
                lastInteractionDate: today
            };
            setShowNotification(false);
        }

        // Save the updated streak data to localStorage
        localStorage.setItem('conversationStreak', JSON.stringify(newStreak));
        setStreakData(newStreak);

        return newStreak;
    }, [getStreakFromStorage]);

    const resetStreak = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const newStreak: StreakData = {
            currentStreak: 0,
            lastInteractionDate: today,
            highestStreak: 0
        };
        localStorage.setItem('conversationStreak', JSON.stringify(newStreak));
        setStreakData(newStreak);
        setShowNotification(false);
    }, []);

    const hideNotification = useCallback(() => {
        setShowNotification(false);
    }, []);

    return {
        streakData,
        getStreakFromStorage,
        updateStreak,
        resetStreak,
        showNotification,
        hideNotification
    };
};