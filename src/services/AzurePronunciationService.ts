
import { notifications } from '@mantine/notifications';


export interface PronunciationAssessmentResult {
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronunciationScore: number;
    words: PronunciationWord[];
    detectedLanguage?: string;
    errorMessage?: string;
}


export interface PronunciationWord {
    word: string;
    accuracyScore: number;
    errorType?: 'Mispronunciation' | 'Omission' | 'Insertion' | null;
    syllables?: { syllable: string; accuracyScore: number }[];
    phonemes?: { phoneme: string; accuracyScore: number }[];
}


export enum FeedbackType {
    PERFECT = 'perfect',
    GOOD = 'good',
    NEEDS_IMPROVEMENT = 'needs_improvement',
    TIP = 'tip',
    STREAK = 'streak',
    ACHIEVEMENT = 'achievement',
    GRAMMAR = 'grammar',
    VOCABULARY = 'vocabulary',
    FLUENCY = 'fluency',
    ENCOURAGEMENT = 'encouragement',
    CHALLENGE = 'challenge'
}


export interface PronunciationFeedback {
    type: FeedbackType;
    message: string;
    details?: string;
    scores?: {
        accuracy?: number;
        fluency?: number;
        completeness?: number;
        pronunciation?: number;
    };
    problemWords?: PronunciationWord[];
    suggestion?: string;
}


export interface PronunciationAssessmentConfig {
    referenceText: string;
    locale: string;
    granularity?: 'phoneme' | 'word' | 'full';
    enableMiscue?: boolean;
    scenarioId?: string;
}

/**
 * Service to handle Azure Speech SDK pronunciation assessment
 */
export class AzurePronunciationService {
    private apiKey: string;
    private region: string;
    private speechSdk: any;
    private isInitialized: boolean = false;

    constructor(apiKey: string, region: string) {
        this.apiKey = apiKey;
        this.region = region;
    }

    /**
     * Initialize the Speech SDK - this is done lazily to avoid loading the SDK unnecessarily
     */
    private async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        try {
            
            const { default: speechSdk } = await import('microsoft-cognitiveservices-speech-sdk');
            this.speechSdk = speechSdk;
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Azure Speech SDK:', error);
            notifications.show({
                title: 'Service Error',
                message: 'Failed to initialize pronunciation assessment service',
                color: 'red'
            });
            return false;
        }
    }

    /**
     * Create a speech recognizer configured for pronunciation assessment
     */
    private async createRecognizer(
        audioFile: ArrayBuffer,
        config: PronunciationAssessmentConfig
    ) {
        if (!await this.initialize()) {
            throw new Error('Failed to initialize Speech SDK');
        }

        const speechConfig = this.speechSdk.SpeechConfig.fromSubscription(this.apiKey, this.region);
        speechConfig.speechRecognitionLanguage = config.locale;

        
        const audioBuffer = new Uint8Array(audioFile);
        const pushStream = this.speechSdk.AudioInputStream.createPushStream();

        
        pushStream.write(audioBuffer);
        pushStream.close();

        const audioConfig = this.speechSdk.AudioConfig.fromStreamInput(pushStream);

        
        const recognizer = new this.speechSdk.SpeechRecognizer(speechConfig, audioConfig);

        
        const pronunciationConfig = new this.speechSdk.PronunciationAssessmentConfig(
            config.referenceText,
            this.speechSdk.PronunciationAssessmentGranularity[config.granularity || 'Phoneme'],
            config.enableMiscue === undefined ? true : config.enableMiscue
        );

        if (config.scenarioId) {
            pronunciationConfig.scenarioId = config.scenarioId;
        }

        
        this.speechSdk.PronunciationAssessmentConfig.applyTo(pronunciationConfig, recognizer);

        return recognizer;
    }

    /**
     * Assess the pronunciation of the given audio against a reference text
     */
    public async assessPronunciation(
        audioData: ArrayBuffer,
        config: PronunciationAssessmentConfig
    ): Promise<PronunciationAssessmentResult> {
        try {
            const recognizer = await this.createRecognizer(audioData, config);

            return new Promise((resolve, reject) => {
                recognizer.recognizeOnceAsync(
                    (result: any) => {
                        if (result.reason === this.speechSdk.ResultReason.RecognizedSpeech) {
                            
                            const pronunciationResult = this.speechSdk.PronunciationAssessmentResult.fromResult(result);

                            
                            const processedResult: PronunciationAssessmentResult = {
                                accuracyScore: pronunciationResult.accuracyScore,
                                fluencyScore: pronunciationResult.fluencyScore,
                                completenessScore: pronunciationResult.completenessScore,
                                pronunciationScore: pronunciationResult.pronunciationScore,
                                words: this.processWordResults(pronunciationResult),
                                detectedLanguage: result.properties.getProperty('language')
                            };

                            resolve(processedResult);
                        } else {
                            
                            reject({
                                errorMessage: `Recognition failed: ${result.errorDetails || result.reason}`,
                                pronunciationScore: 0,
                                accuracyScore: 0,
                                fluencyScore: 0,
                                completenessScore: 0,
                                words: []
                            });
                        }

                        
                        recognizer.close();
                    },
                    (error: any) => {
                        console.error('Speech recognition error:', error);
                        recognizer.close();
                        reject({
                            errorMessage: `Error during speech recognition: ${error}`,
                            pronunciationScore: 0,
                            accuracyScore: 0,
                            fluencyScore: 0,
                            completenessScore: 0,
                            words: []
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Failed to assess pronunciation:', error);
            return {
                errorMessage: `Failed to assess pronunciation: ${error instanceof Error ? error.message : 'Unknown error'}`,
                pronunciationScore: 0,
                accuracyScore: 0,
                fluencyScore: 0,
                completenessScore: 0,
                words: []
            };
        }
    }

    /**
     * Process word-level results from pronunciation assessment
     */
    private processWordResults(pronunciationResult: any): PronunciationWord[] {
        const words: PronunciationWord[] = [];

        
        if (pronunciationResult.detailResult && pronunciationResult.detailResult.words) {
            for (const wordResult of pronunciationResult.detailResult.words) {
                const word: PronunciationWord = {
                    word: wordResult.word,
                    accuracyScore: wordResult.accuracyScore,
                    errorType: wordResult.errorType
                };

                
                if (wordResult.phonemes) {
                    word.phonemes = wordResult.phonemes.map((p: any) => ({
                        phoneme: p.phoneme,
                        accuracyScore: p.accuracyScore
                    }));
                }

                
                if (wordResult.syllables) {
                    word.syllables = wordResult.syllables.map((s: any) => ({
                        syllable: s.syllable,
                        accuracyScore: s.accuracyScore
                    }));
                }

                words.push(word);
            }
        }

        return words;
    }

    /**
     * Generate appropriate feedback based on pronunciation assessment results
     */
    public generateFeedback(result: PronunciationAssessmentResult, referenceText: string): PronunciationFeedback {
        
        if (result.errorMessage) {
            return {
                type: FeedbackType.NEEDS_IMPROVEMENT,
                message: "We couldn't assess your pronunciation",
                details: "There was a problem with the audio recording. Please try again."
            };
        }

        
        const overallScore = (
            result.accuracyScore +
            result.fluencyScore +
            result.completenessScore +
            result.pronunciationScore
        ) / 4;

        
        const problemWords = result.words.filter(word => word.accuracyScore < 70);

        
        if (overallScore > 90 && problemWords.length === 0) {
            return {
                type: FeedbackType.PERFECT,
                message: "Perfect pronunciation! 🎯",
                scores: {
                    accuracy: result.accuracyScore,
                    fluency: result.fluencyScore,
                    completeness: result.completenessScore,
                    pronunciation: result.pronunciationScore
                }
            };
        }

        
        if (overallScore > 75) {
            return {
                type: FeedbackType.GOOD,
                message: "Good pronunciation 👍",
                details: problemWords.length > 0
                    ? `Try to improve the pronunciation of: ${problemWords.map(w => w.word).join(', ')}`
                    : "Your fluency could be improved by speaking more smoothly.",
                scores: {
                    accuracy: result.accuracyScore,
                    fluency: result.fluencyScore,
                    completeness: result.completenessScore,
                    pronunciation: result.pronunciationScore
                },
                problemWords
            };
        }

        
        return {
            type: FeedbackType.NEEDS_IMPROVEMENT,
            message: "Keep practicing pronunciation",
            details: `Focus on these words: ${problemWords.map(w => w.word).join(', ')}`,
            scores: {
                accuracy: result.accuracyScore,
                fluency: result.fluencyScore,
                completeness: result.completenessScore,
                pronunciation: result.pronunciationScore
            },
            problemWords,
            suggestion: "Try speaking more slowly and clearly."
        };
    }

    /**
     * Generate a vocabulary or grammar feedback based on user's input text
     */
    public generateLanguageFeedback(
        text: string,
        feedbackType: 'vocabulary' | 'grammar' = 'vocabulary'
    ): PronunciationFeedback {
        
        

        if (feedbackType === 'vocabulary') {
            return {
                type: FeedbackType.VOCABULARY,
                message: "Good vocabulary usage! 📚",
                details: "You're using appropriate vocabulary for your level."
            };
        } else {
            return {
                type: FeedbackType.GRAMMAR,
                message: "Grammatically correct! ✓",
                details: "Your sentence structure is well-formed."
            };
        }
    }

    /**
     * Generate an achievement or streak feedback
     */
    public generateAchievementFeedback(
        achievementType: 'streak' | 'level' | 'vocabulary',
        value: number
    ): PronunciationFeedback {
        switch (achievementType) {
            case 'streak':
                return {
                    type: FeedbackType.STREAK,
                    message: `${value}-day streak! 🔥`,
                    details: "Keep up the consistent practice!"
                };
            case 'level':
                return {
                    type: FeedbackType.ACHIEVEMENT,
                    message: `Level ${value} reached! 🎓`,
                    details: "You're making great progress in your language journey."
                };
            case 'vocabulary':
                return {
                    type: FeedbackType.ACHIEVEMENT,
                    message: `${value} words mastered! 🏆`,
                    details: "Your vocabulary is expanding nicely."
                };
            default:
                return {
                    type: FeedbackType.ENCOURAGEMENT,
                    message: "Keep up the good work! 👏",
                    details: "You're making steady progress."
                };
        }
    }
}


export const useAzurePronunciation = (
    apiKey = import.meta.env.VITE_AZURE_SPEECH_KEY || '',
    region = import.meta.env.VITE_AZURE_SPEECH_REGION || 'eastus'
) => {
    const service = new AzurePronunciationService(apiKey, region);

    return {
        assessPronunciation: async (
            audioData: ArrayBuffer,
            referenceText: string,
            locale: string = 'en-US',
            granularity: 'phoneme' | 'word' | 'full' = 'phoneme'
        ): Promise<{result: PronunciationAssessmentResult, feedback: PronunciationFeedback}> => {
            const config: PronunciationAssessmentConfig = {
                referenceText,
                locale,
                granularity,
                enableMiscue: true
            };

            try {
                const result = await service.assessPronunciation(audioData, config);
                const feedback = service.generateFeedback(result, referenceText);
                return { result, feedback };
            } catch (error) {
                console.error('Pronunciation assessment failed:', error);
                const errorResult: PronunciationAssessmentResult = {
                    accuracyScore: 0,
                    fluencyScore: 0,
                    completenessScore: 0,
                    pronunciationScore: 0,
                    words: [],
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                };
                const errorFeedback = service.generateFeedback(errorResult, referenceText);
                return { result: errorResult, feedback: errorFeedback };
            }
        },

        generateLanguageFeedback: (
            text: string,
            feedbackType: 'vocabulary' | 'grammar' = 'vocabulary'
        ): PronunciationFeedback => {
            return service.generateLanguageFeedback(text, feedbackType);
        },

        generateAchievementFeedback: (
            achievementType: 'streak' | 'level' | 'vocabulary',
            value: number
        ): PronunciationFeedback => {
            return service.generateAchievementFeedback(achievementType, value);
        }
    };
};