/**
 * Configuration for pronunciation assessment
 */

// Map of target languages to their respective locale codes for Azure Speech Services
export const languageLocaleMap: Record<string, string> = {
    'english': 'en-US',
    'spanish': 'es-ES',
    'french': 'fr-FR',
    'german': 'de-DE',
    'italian': 'it-IT',
    'portuguese': 'pt-BR',
    'chinese': 'zh-CN',
    'japanese': 'ja-JP',
    'korean': 'ko-KR',
    'russian': 'ru-RU',
    'arabic': 'ar-EG',
    'hindi': 'hi-IN',
    // Add more languages as needed
};

// Default reference texts for pronunciation practice
export const defaultReferencePhrases: Record<string, string[]> = {
    'english': [
        'Hello, how are you today?',
        'I would like to learn English',
        'Where is the nearest restaurant?',
        'Could you please speak more slowly?',
        'Thank you very much for your help',
    ],
    'spanish': [
        'Hola, ¿cómo estás hoy?',
        'Me gustaría aprender español',
        '¿Dónde está el restaurante más cercano?',
        '¿Podrías hablar más despacio, por favor?',
        'Muchas gracias por tu ayuda',
    ],
    'french': [
        'Bonjour, comment allez-vous aujourd\'hui?',
        'Je voudrais apprendre le français',
        'Où est le restaurant le plus proche?',
        'Pourriez-vous parler plus lentement, s\'il vous plaît?',
        'Merci beaucoup pour votre aide',
    ],
    'german': [
        'Hallo, wie geht es Ihnen heute?',
        'Ich möchte Deutsch lernen',
        'Wo ist das nächste Restaurant?',
        'Könnten Sie bitte langsamer sprechen?',
        'Vielen Dank für Ihre Hilfe',
    ],
    // Add more languages as needed
};

// Feedback messages for perfect pronunciation by language
export const perfectPronunciationMessages: Record<string, string[]> = {
    'english': [
        'Perfect pronunciation! 🎯',
        'Excellent! Your pronunciation is spot on!',
        'Wow! Native-like pronunciation!',
        'Perfect! Your accent is getting really good!',
    ],
    'spanish': [
        '¡Pronunciación perfecta! 🎯',
        '¡Excelente! Tu pronunciación es impecable!',
        '¡Guau! ¡Pronunciación como la de un nativo!',
        '¡Perfecto! ¡Tu acento está mejorando mucho!',
    ],
    'french': [
        'Prononciation parfaite! 🎯',
        'Excellent! Votre prononciation est impeccable!',
        'Wow! Prononciation comme un natif!',
        'Parfait! Votre accent s\'améliore vraiment!',
    ],
    // Add more languages as needed
};

// Feedback messages for good pronunciation by language
export const goodPronunciationMessages: Record<string, string[]> = {
    'english': [
        'Good pronunciation 👍',
        'Well done on your pronunciation',
        'Your pronunciation is coming along nicely',
        'Good job with those sounds!',
    ],
    'spanish': [
        'Buena pronunciación 👍',
        'Bien hecho con tu pronunciación',
        'Tu pronunciación va mejorando',
        '¡Buen trabajo con esos sonidos!',
    ],
    'french': [
        'Bonne prononciation 👍',
        'Bien fait sur votre prononciation',
        'Votre prononciation s\'améliore bien',
        'Bon travail avec ces sons!',
    ],
    // Add more languages as needed
};

// Feedback messages for pronunciation that needs improvement
export const improvementPronunciationMessages: Record<string, string[]> = {
    'english': [
        'Keep practicing pronunciation',
        'Let\'s work on those sounds',
        'With more practice, you\'ll improve',
        'Try slowing down a bit',
    ],
    'spanish': [
        'Sigue practicando la pronunciación',
        'Trabajemos en esos sonidos',
        'Con más práctica, mejorarás',
        'Intenta hablar un poco más despacio',
    ],
    'french': [
        'Continuez à pratiquer la prononciation',
        'Travaillons sur ces sons',
        'Avec plus de pratique, vous vous améliorerez',
        'Essayez de ralentir un peu',
    ],
    // Add more languages as needed
};

// Tips for pronunciation improvement by language
export const pronunciationTips: Record<string, Record<string, string[]>> = {
    'english': {
        'th': [
            'For "th" sounds, place your tongue between your teeth slightly',
            'Practice "th" in words like "the", "think", and "both"',
        ],
        'r': [
            'The English "r" sound is formed by curling your tongue back',
            'Practice the "r" sound in words like "red", "tree", and "start"',
        ],
        'l': [
            'For the "l" sound, place the tip of your tongue on the ridge behind your upper teeth',
            'Practice the "l" sound in words like "light", "feel", and "believe"',
        ],
    },
    'spanish': {
        'r': [
            'The Spanish "r" is a light tap with the tongue against the ridge behind your upper teeth',
            'The Spanish "rr" is a rolled or trilled sound - keep practicing!',
        ],
        'j': [
            'The Spanish "j" is pronounced like the English "h" but stronger',
            'Practice the "j" sound in words like "trabajo", "ojo", and "jugar"',
        ],
        'ñ': [
            'For "ñ", say "n" but with the middle of your tongue touching the roof of your mouth',
            'Practice the "ñ" sound in words like "niño", "mañana", and "español"',
        ],
    },
    // Add more languages as needed
};

// Common problematic phonemes by native language
export const problematicPhonemes: Record<string, Record<string, string[]>> = {
    'english': {
        'spanish': ['th', 'r', 'h', 'j', 'w', 'v'],
        'french': ['h', 'th', 'r', 'j', 'ng'],
        'chinese': ['r', 'l', 'th', 'v', 'z'],
        'japanese': ['r', 'l', 'th', 'v', 'w'],
    },
    'spanish': {
        'english': ['r', 'rr', 'j', 'g', 'ñ', 'b/v'],
        'french': ['r', 'j', 'h', 'z'],
        'chinese': ['r', 'rr', 'd', 't', 'b/v'],
        'japanese': ['r', 'rr', 'l', 'd', 'g'],
    },
    // Add more languages as needed
};

// Grammar tips by language
export const grammarTips: Record<string, string[]> = {
    'english': [
        'Remember to use articles ("a", "an", "the") before nouns',
        'Pay attention to verb tenses - especially past tense forms',
        'Word order is important: Subject + Verb + Object',
        'Don\'t forget to use "do" or "does" in questions and negatives',
    ],
    'spanish': [
        'Remember that adjectives usually come after nouns in Spanish',
        'Pay attention to noun gender (masculine/feminine)',
        'Don\'t forget to use subject pronouns only for emphasis or clarity',
        'Be careful with ser vs. estar - they both mean "to be" but are used differently',
    ],
    'french': [
        'Remember that adjectives usually agree with the gender and number of the noun',
        'Pay attention to the difference between passé composé and imparfait',
        'Don\'t forget to use articles before nouns',
        'Be careful with the placement of adverbs',
    ],
    // Add more languages as needed
};

// Vocabulary tips by language level
export const vocabularyTips: Record<string, Record<string, string[]>> = {
    'english': {
        'beginner': [
            'Focus on learning common everyday words first',
            'Group vocabulary by themes like food, travel, or family',
            'Practice using new words in simple sentences',
        ],
        'intermediate': [
            'Start learning more specific vocabulary related to your interests',
            'Pay attention to collocations (words that often go together)',
            'Learn synonyms to expand your vocabulary range',
        ],
        'advanced': [
            'Work on nuanced vocabulary and idiomatic expressions',
            'Pay attention to connotations and subtle differences between similar words',
            'Expand your academic or professional vocabulary',
        ],
    },
    // Add more languages as needed
};

// Export a function to get locale based on language
export function getLocaleForLanguage(language: string): string {
    const normalizedLanguage = language.toLowerCase().trim();
    return languageLocaleMap[normalizedLanguage] || 'en-US';
}

// Export a function to get random reference phrase
export function getRandomReferencePhrase(language: string): string {
    const normalizedLanguage = language.toLowerCase().trim();
    const phrases = defaultReferencePhrases[normalizedLanguage] || defaultReferencePhrases['english'];
    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
}

// Export a function to get a random feedback message based on score and language
export function getFeedbackMessage(
    score: number,
    language: string,
    type: 'perfect' | 'good' | 'needs_improvement'
): string {
    const normalizedLanguage = language.toLowerCase().trim();

    let messages: string[];

    // Get appropriate message array
    switch (type) {
        case 'perfect':
            messages = perfectPronunciationMessages[normalizedLanguage] || perfectPronunciationMessages['english'];
            break;
        case 'good':
            messages = goodPronunciationMessages[normalizedLanguage] || goodPronunciationMessages['english'];
            break;
        case 'needs_improvement':
            messages = improvementPronunciationMessages[normalizedLanguage] || improvementPronunciationMessages['english'];
            break;
    }

    // Return a random message
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
}