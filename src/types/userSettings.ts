export interface UserSettings {
  targetLanguageCode: string;
  nativeLanguageCode?: string;
  preferredModel?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  theme?: 'light' | 'dark' | 'system';
  speechEnabled?: boolean;
  correctionStyle?: 'immediate' | 'delayed' | 'askFirst';
} 