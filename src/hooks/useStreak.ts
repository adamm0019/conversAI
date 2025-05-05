import { useState, useCallback, useEffect } from 'react';

interface StreakData {
    currentStreak: number;
    lastInteractionDate: string;
    highestStreak: number;
}

const daysBetween = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const useStreak = () => {
    const [showNotification, setShowNotification] = useState(false);
    const [streakData, setStreakData] = useState<StreakData>(() => getInitialStreakData());

    function getInitialStreakData(): StreakData {
        try {
            const stored = localStorage.getItem('conversationStreak');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error parsing streak data from localStorage:', e);
        }
        
        const today = new Date().toISOString().split('T')[0];
        return {
            currentStreak: 0,
            lastInteractionDate: today,
            highestStreak: 0
        };
    }

    const getStreakFromStorage = useCallback((): StreakData => {
        try {
            const stored = localStorage.getItem('conversationStreak');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error parsing streak data from localStorage:', e);
        }
        return streakData;
    }, [streakData]);

    
    const updateStreak = useCallback(() => {
        try {
            const currentStreak = getStreakFromStorage();
            const today = new Date().toISOString().split('T')[0];

            
            if (currentStreak.lastInteractionDate === today) {
                return currentStreak;
            }

            
            const daysDiff = daysBetween(currentStreak.lastInteractionDate, today);
            
            let newStreak: StreakData;
            
            
            if (daysDiff === 1) {
                newStreak = {
                    currentStreak: currentStreak.currentStreak + 1,
                    lastInteractionDate: today,
                    highestStreak: Math.max(currentStreak.highestStreak, currentStreak.currentStreak + 1)
                };
                setShowNotification(true);
            } 
            
            else if (daysDiff > 1) {
                newStreak = {
                    currentStreak: 1, 
                    lastInteractionDate: today,
                    highestStreak: currentStreak.highestStreak 
                };
                setShowNotification(false);
            }
            
            else {
                newStreak = {
                    ...currentStreak,
                    lastInteractionDate: today
                };
                setShowNotification(false);
            }

            
            localStorage.setItem('conversationStreak', JSON.stringify(newStreak));
            setStreakData(newStreak);

            console.log('Updated streak:', newStreak);
            return newStreak;
        } catch (error) {
            console.error('Error updating streak:', error);
            return getStreakFromStorage();
        }
    }, [getStreakFromStorage]);

    
    useEffect(() => {
        
        updateStreak();
    }, [updateStreak]);

    const resetStreak = useCallback(() => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const newStreak: StreakData = {
                currentStreak: 0,
                lastInteractionDate: today,
                highestStreak: 0
            };
            localStorage.setItem('conversationStreak', JSON.stringify(newStreak));
            setStreakData(newStreak);
            setShowNotification(false);
            console.log('Reset streak');
        } catch (error) {
            console.error('Error resetting streak:', error);
        }
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