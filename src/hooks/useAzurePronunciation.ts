import { useState, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useAudioRecording } from './useAudioRecording';
import { AzurePronunciationService, PronunciationAssessmentResult, PronunciationFeedback, PronunciationAssessmentConfig } from '../services/AzurePronunciationService';
import { azureSpeechConfig, errorMessages } from '../config/azureConfig';
import { getLocaleForLanguage } from '../config/pronunciationConfig';
import { PronunciationAssessmentGranularity } from 'microsoft-cognitiveservices-speech-sdk';

export interface PronunciationState {
    isRecording: boolean;
    isProcessing: boolean;
    targetPhrase: string;
    result: PronunciationAssessmentResult | null;
    feedback: PronunciationFeedback | null;
    audioLevel: number;
    error: string | null;
}

export interface UseAzurePronunciationOptions {
    language?: string;
    enableFeedback?: boolean;
    onResultReceived?: (result: PronunciationAssessmentResult) => void;
    onError?: (error: string) => void;
}

export const useAzurePronunciation = (
    initialTargetPhrase: string = '',
    options: UseAzurePronunciationOptions = {}
) => {

    const [state, setState] = useState<PronunciationState>({
        isRecording: false,
        isProcessing: false,
        targetPhrase: initialTargetPhrase,
        result: null,
        feedback: null,
        audioLevel: 0,
        error: null,
    });


    const serviceRef = useRef<AzurePronunciationService | null>(null);


    const {
        isRecording,
        rawAudioBuffer,
        startRecording,
        stopRecording,
        getAudioLevel
    } = useAudioRecording();


    const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);


    const initializeService = useCallback(() => {
        if (!serviceRef.current) {
            try {
                serviceRef.current = new AzurePronunciationService(
                    azureSpeechConfig.key,
                    azureSpeechConfig.region
                );
                return true;
            } catch (error) {

                setState(prev => ({ ...prev, error: errorMessages.initializationFailed }));
                if (options.onError) {
                    options.onError(errorMessages.initializationFailed);
                }
                return false;
            }
        }
        return true;
    }, [options]);


    const startAssessment = useCallback(async (targetPhrase: string = state.targetPhrase) => {

        setState(prev => ({
            ...prev,
            isRecording: true,
            isProcessing: false,
            targetPhrase,
            result: null,
            feedback: null,
            error: null
        }));


        if (!initializeService()) {
            return;
        }

        try {

            await startRecording();


            if (audioLevelIntervalRef.current) {
                clearInterval(audioLevelIntervalRef.current);
            }

            audioLevelIntervalRef.current = setInterval(() => {
                const level = getAudioLevel();
                setState(prev => ({ ...prev, audioLevel: level }));
            }, 100);

        } catch (error) {

            setState(prev => ({
                ...prev,
                isRecording: false,
                error: errorMessages.recordingError
            }));

            if (options.onError) {
                options.onError(errorMessages.recordingError);
            }
        }
    }, [state.targetPhrase, initializeService, startRecording, getAudioLevel, options]);


    const stopAssessment = useCallback(async () => {

        if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current);
            audioLevelIntervalRef.current = null;
        }


        setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));


        stopRecording();


        if (rawAudioBuffer) {
            try {

                const locale = options.language
                    ? getLocaleForLanguage(options.language)
                    : azureSpeechConfig.defaultLocale;


                const config: PronunciationAssessmentConfig = {
                    referenceText: state.targetPhrase,
                    locale,
                    granularity: "phoneme",
                    enableMiscue: azureSpeechConfig.enableMiscue
                };


                if (serviceRef.current) {
                    const result = await serviceRef.current.assessPronunciation(
                        rawAudioBuffer,
                        config
                    );


                    let feedback: PronunciationFeedback | null = null;
                    if (options.enableFeedback && serviceRef.current && !result.errorMessage) {
                        feedback = serviceRef.current.generateFeedback(result, state.targetPhrase);
                    }


                    setState(prev => ({
                        ...prev,
                        result,
                        feedback,
                        isProcessing: false
                    }));


                    if (options.onResultReceived) {
                        options.onResultReceived(result);
                    }


                    if (!result.errorMessage) {
                        notifications.show({
                            title: 'Assessment Complete',
                            message: 'Your pronunciation has been assessed',
                            color: 'green',
                        });
                    } else {
                        setState(prev => ({ ...prev, error: result.errorMessage || null }));
                        if (options.onError && result.errorMessage) {
                            options.onError(result.errorMessage);
                        }
                    }
                }
            } catch (error) {


                const errorMessage = error instanceof Error
                    ? error.message
                    : errorMessages.serviceError;

                setState(prev => ({
                    ...prev,
                    isProcessing: false,
                    error: errorMessage
                }));

                if (options.onError) {
                    options.onError(errorMessage);
                }
            }
        } else {
            setState(prev => ({
                ...prev,
                isProcessing: false,
                error: 'No audio data recorded'
            }));

            if (options.onError) {
                options.onError('No audio data recorded');
            }
        }
    }, [rawAudioBuffer, stopRecording, state.targetPhrase, options]);


    const setTargetPhrase = useCallback((phrase: string) => {
        setState(prev => ({ ...prev, targetPhrase: phrase }));
    }, []);


    const clearResult = useCallback(() => {
        setState(prev => ({ ...prev, result: null, feedback: null, error: null }));
    }, []);


    return {
        ...state,
        startAssessment,
        stopAssessment,
        setTargetPhrase,
        clearResult,
    };
};

export default useAzurePronunciation; 