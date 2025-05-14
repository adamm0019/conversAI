import { 
  SpeechConfig, 
  AudioConfig, 
  SpeechRecognizer, 
  PronunciationAssessmentConfig as AzurePronunciationConfig, 
  PronunciationAssessmentGradingSystem, 
  PronunciationAssessmentGranularity 
} from 'microsoft-cognitiveservices-speech-sdk';
import { getLocaleForLanguage } from '../config/pronunciationConfig';
import { ConversationItem } from '../types/conversation';

export enum FeedbackType {
  PERFECT = 'perfect',
  GOOD = 'good',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  STREAK = 'streak',
  ACHIEVEMENT = 'achievement',
  GRAMMAR = 'grammar',
  VOCABULARY = 'vocabulary',
  FLUENCY = 'fluency',
  TIP = 'tip',
  ENCOURAGEMENT = 'encouragement',
  CHALLENGE = 'challenge'
}

export interface WordResult {
  word: string;
  offset: number;
  duration: number;
  accuracyScore: number;
}

export interface PronunciationScores {
  accuracy?: number;
  fluency?: number;
  completeness?: number;
  pronunciation?: number;
}

export interface PronunciationFeedback {
  type: FeedbackType;
  message: string;
  details?: string;
  scores?: PronunciationScores;
  problemWords?: WordResult[];
  suggestion?: string;
}

export interface PronunciationAssessmentResult {
  text: string;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore?: number;
  words: WordResult[];
  detailedResults?: any;
  errorMessage?: string;
}

export interface PronunciationAssessmentConfig {
  referenceText: string;
  locale: string;
  granularity: string;
  enableMiscue: boolean;
}

export class AzurePronunciationService {
  private apiKey: string;
  private region: string;

  constructor(apiKey: string, region: string) {
    this.apiKey = apiKey;
    this.region = region;
  }

  async assessPronunciation(
    audioBuffer: ArrayBuffer,
    config: PronunciationAssessmentConfig
  ): Promise<PronunciationAssessmentResult> {
    try {
      const speechConfig = SpeechConfig.fromSubscription(this.apiKey, this.region);
      speechConfig.speechRecognitionLanguage = config.locale;
      
      const audioData = new Uint8Array(audioBuffer);
      
      let audioConfig;
      
      if (typeof Buffer !== 'undefined') {
        const buffer = Buffer.from(audioData);
        audioConfig = AudioConfig.fromWavFileInput(buffer);
      } else {
        audioConfig = AudioConfig.fromDefaultMicrophoneInput();
      }

      const pronunciationConfig = new AzurePronunciationConfig(
        config.referenceText,
        PronunciationAssessmentGradingSystem.HundredMark,
        config.granularity === 'phoneme' 
          ? PronunciationAssessmentGranularity.Phoneme 
          : PronunciationAssessmentGranularity.Word,
        config.enableMiscue
      );

      const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
      pronunciationConfig.applyTo(recognizer);

      return new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            try {
              if (!result.properties || !result.properties.getProperty('PronunciationAssessment.Results')) {
                resolve({
                  text: result.text || '',
                  overallScore: 0,
                  accuracyScore: 0,
                  fluencyScore: 0,
                  completenessScore: 0,
                  words: [],
                  errorMessage: 'No pronunciation assessment results available'
                });
                return;
              }

              const pronunciationResult = JSON.parse(
                result.properties.getProperty('PronunciationAssessment.Results')
              );

              if (!pronunciationResult.NBest || pronunciationResult.NBest.length === 0) {
                resolve({
                  text: result.text || '',
                  overallScore: 0,
                  accuracyScore: 0,
                  fluencyScore: 0,
                  completenessScore: 0,
                  words: [],
                  errorMessage: 'No speech detected or understood'
                });
                return;
              }

              const bestResult = pronunciationResult.NBest[0];
              const assessment = bestResult.PronunciationAssessment || {};

              const words = (bestResult.Words || []).map((w: any) => ({
                word: w.Word,
                offset: w.Offset,
                duration: w.Duration,
                accuracyScore: w.PronunciationAssessment?.AccuracyScore || 0
              }));

              resolve({
                text: result.text || '',
                overallScore: assessment.PronScore || 0,
                accuracyScore: assessment.AccuracyScore || 0,
                fluencyScore: assessment.FluencyScore || 0,
                completenessScore: assessment.CompletenessScore || 0,
                prosodyScore: assessment.ProsodyScore,
                words: words,
                detailedResults: pronunciationResult
              });
            } catch (error) {
              resolve({
                text: result.text || '',
                overallScore: 0,
                accuracyScore: 0,
                fluencyScore: 0,
                completenessScore: 0,
                words: [],
                errorMessage: error instanceof Error ? error.message : 'Error parsing pronunciation results'
              });
            } finally {
              recognizer.close();
            }
          },
          (error) => {
            recognizer.close();
            reject(error);
          }
        );
      });
    } catch (error) {
      return {
        text: '',
        overallScore: 0,
        accuracyScore: 0,
        fluencyScore: 0,
        completenessScore: 0,
        words: [],
        errorMessage: error instanceof Error ? error.message : 'Failed to assess pronunciation'
      };
    }
  }

  generateFeedback(
    result: PronunciationAssessmentResult,
    referenceText: string
  ): PronunciationFeedback {
    let type: FeedbackType;
    let message: string;
    let details: string | undefined;

    if (result.overallScore >= 85) {
      type = FeedbackType.PERFECT;
      message = "Excellent pronunciation!";
      details = "Your pronunciation is very close to native level.";
    } else if (result.overallScore >= 70) {
      type = FeedbackType.GOOD;
      message = "Good pronunciation";
      details = "You're doing well, but there's still room for improvement.";
    } else {
      type = FeedbackType.NEEDS_IMPROVEMENT;
      message = "Keep practicing";
      details = "Focus on the highlighted words to improve your pronunciation.";
    }

    const problemWords = result.words.filter(word => word.accuracyScore < 70);

    let suggestion: string | undefined;
    if (problemWords.length > 0) {
      suggestion = `Try focusing on these words: ${problemWords.slice(0, 3).map(w => w.word).join(', ')}`;
    }

    return {
      type,
      message,
      details,
      scores: {
        accuracy: result.accuracyScore,
        fluency: result.fluencyScore,
        completeness: result.completenessScore,
        pronunciation: result.overallScore
      },
      problemWords,
      suggestion
    };
  }
}

export const useAzurePronunciation = () => {
  return {
    assessPronunciation: async (audioBuffer: ArrayBuffer, referenceText: string, locale: string) => {
      return {
        result: {
          text: '',
          overallScore: 0,
          accuracyScore: 0,
          fluencyScore: 0,
          completenessScore: 0,
          words: []
        },
        feedback: null
      };
    },
    generateLanguageFeedback: (message: ConversationItem, type: 'grammar' | 'vocabulary') => {
      return {
        type: type === 'grammar' ? FeedbackType.GRAMMAR : FeedbackType.VOCABULARY,
        message: `${type === 'grammar' ? 'Grammar' : 'Vocabulary'} feedback`,
        details: 'This is a placeholder feedback message'
      };
    },
    generateAchievementFeedback: () => {
      return {
        type: FeedbackType.ACHIEVEMENT,
        message: 'Achievement unlocked!',
        details: 'This is a placeholder achievement message'
      };
    }
  };
};

export default useAzurePronunciation;
