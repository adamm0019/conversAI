// src/hooks/useStreak.ts
import { useState, useCallback } from 'react';

interface StreakData {
    currentStreak: number;
    lastInteractionDate: string;
    highestStreak: number;
}

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

    // in useStreak.ts
    const updateStreak = useCallback(() => {
        const currentStreak = getStreakFromStorage();
        const today = new Date().toISOString().split('T')[0];

        // If already interacted today, just return current streak
        if (currentStreak.lastInteractionDate === today) {
            return currentStreak;
        }

        // Increment streak
        const newStreak = {
            currentStreak: currentStreak.currentStreak + 1,
            lastInteractionDate: today,
            highestStreak: Math.max(currentStreak.highestStreak, currentStreak.currentStreak + 1)
        };

        // Update localStorage and state
        localStorage.setItem('conversationStreak', JSON.stringify(newStreak));
        setStreakData(newStreak);
        setShowNotification(true);

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