import React from 'react';
import { Header } from './Header/Header';

interface AppHeaderProps {
    selectedMode?: string;
    onModeChange?: (value: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
                                                        selectedMode = 'tutor',
                                                        onModeChange = (value) => console.log('Mode changed:', value)
                                                    }) => {
    return (
        <Header
            selectedMode={selectedMode}
            onModeChange={onModeChange}
            onResetAPIKey={() => console.log('Reset API key')}
            showSettings={true}
        />
    );
};

export default AppHeader;