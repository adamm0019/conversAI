export interface DynamicVariables {
    [key: string]: string | number | boolean;
}

export function sanitizeDynamicVariables(vars: Record<string, any>): DynamicVariables {
    const result: DynamicVariables = {};

    Object.entries(vars).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            switch (key) {
                case 'user_name':
                    result[key] = 'there';
                    break;
                case 'subscription_tier':
                    result[key] = 'free';
                    break;
                case 'language_level':
                    result[key] = 'beginner';
                    break;
                case 'target_language':
                    result[key] = 'Spanish';
                    break;
                case 'days_streak':
                case 'vocabulary_mastered':
                case 'grammar_mastered':
                case 'total_progress':
                    result[key] = 0;
                    break;
                case 'custom_greeting':
                    result[key] = 'Welcome to your language learning journey';
                    break;
                case 'learning_style':
                    result[key] = 'conversational';
                    break;
                case 'feedback_style':
                    result[key] = 'encouraging';
                    break;
                case 'difficulty_preference':
                    result[key] = 'balanced';
                    break;
                default:
                    result[key] = '';
            }
        } else {
            result[key] = value;
        }
    });

    return result;
}