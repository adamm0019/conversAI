import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  Group,
  Stack,
  Progress,
  Badge,
  Title,
  Paper,
  SimpleGrid,
  Center,
  RingProgress,
  Loader,
  rem
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconMicrophone, 
  IconPlayerStop, 
  IconBrain, 
  IconVolume, 
  IconCheck, 
  IconAlertTriangle, 
  IconTrophy,
  IconRefresh,
  IconArrowLeft
} from '@tabler/icons-react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { languageLocaleMap } from '../config/pronunciationConfig';

const glassmorphicStyle = {
  background: 'rgba(28, 29, 34, 0.6)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(39, 40, 46, 0.8)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
};

const glassmorphicButton = {
  background: 'rgba(28, 29, 34, 0.7)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(39, 40, 46, 0.8)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  height: '42px',
  padding: '0 24px',
  transition: 'all 0.2s ease'
};

interface PronunciationAssessmentProps {
  referenceText: string;
  language: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

interface AssessmentResult {
  pronunciationScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore?: number;
  words: Array<{
    word: string;
    accuracyScore: number;
    errorType?: string;
    phonemes?: Array<{
      phoneme: string;
      accuracyScore: number;
    }>;
  }>;
  errorMessage?: string;
}

const PronunciationAssessment: React.FC<PronunciationAssessmentProps> = ({
  referenceText,
  language,
  onComplete,
  onError
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);
  
  const audioConfig = useRef<sdk.AudioConfig | null>(null);
  const speechConfig = useRef<sdk.SpeechConfig | null>(null);
  const pronunciationConfig = useRef<sdk.PronunciationAssessmentConfig | null>(null);
  
  const KEY = import.meta.env.VITE_AZURE_SPEECH_KEY || '';
  const REGION = import.meta.env.VITE_AZURE_SPEECH_REGION || '';
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#43c59e';
    if (score >= 60) return '#e6854a';
    return '#d64161';
  };

  const setupAudioStream = () => {
    try {
      if (!navigator.mediaDevices) {
        throw new Error("Browser doesn't support audio input");
      }
      
      audioConfig.current = sdk.AudioConfig.fromDefaultMicrophoneInput();
      speechConfig.current = sdk.SpeechConfig.fromSubscription(KEY, REGION);
      
      const locale = languageLocaleMap[language] || 'en-US';
      speechConfig.current.speechRecognitionLanguage = locale;
      
      pronunciationConfig.current = new sdk.PronunciationAssessmentConfig(
        referenceText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true 
      );
      
      pronunciationConfig.current.enableProsodyAssessment = true;
      
      recognizerRef.current = new sdk.SpeechRecognizer(
        speechConfig.current,
        audioConfig.current
      );
      
      pronunciationConfig.current.applyTo(recognizerRef.current);
      
      setupRecognitionEventHandlers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup audio stream';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  };

  const setupRecognitionEventHandlers = () => {
    if (!recognizerRef.current) return;
    
    recognizerRef.current.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        try {
          const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(e.result);
          
          const jsonResponse = JSON.parse(
            e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)
          );
          
          const words = jsonResponse.NBest[0].Words.map((word: any) => ({
            word: word.Word,
            accuracyScore: word.PronunciationAssessment.AccuracyScore,
            errorType: word.PronunciationAssessment.ErrorType,
            phonemes: word.Phonemes?.map((phoneme: any) => ({
              phoneme: phoneme.Phoneme,
              accuracyScore: phoneme.PronunciationAssessment?.AccuracyScore || 0
            }))
          }));
          
          const resultData: AssessmentResult = {
            pronunciationScore: pronunciationResult.pronunciationScore,
            accuracyScore: pronunciationResult.accuracyScore,
            fluencyScore: pronunciationResult.fluencyScore,
            completenessScore: pronunciationResult.completenessScore,
            prosodyScore: pronunciationResult.prosodyScore,
            words
          };
          
          setResult(resultData);
          setIsProcessing(false);
          
          if (onComplete) {
            onComplete(resultData);
          }
        } catch (err) {
          const errorMessage = err instanceof Error 
            ? err.message 
            : 'Error processing pronunciation result';
          setError(errorMessage);
          if (onError) onError(errorMessage);
        }
      }
    };
    
    recognizerRef.current.canceled = (s, e) => {
      if (e.reason === sdk.CancellationReason.Error) {
        const errorMessage = `Recognition canceled: ${e.errorDetails}`;
        setError(errorMessage);
        if (onError) onError(errorMessage);
      }
      setIsRecording(false);
      setIsProcessing(false);
    };
    
    recognizerRef.current.sessionStopped = () => {
      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync();
      }
      setIsRecording(false);
      setIsProcessing(false);
    };
    
    try {
      if (audioConfig.current) {
        const audioMonitoring = new AudioContext();
        const analyser = audioMonitoring.createAnalyser();
        analyser.fftSize = 256;
        
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            const source = audioMonitoring.createMediaStreamSource(stream);
            source.connect(analyser);
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            const updateLevel = () => {
              if (!isRecording) return;
              
              analyser.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
              setAudioLevel(Math.min(1, average / 128));
              
              requestAnimationFrame(updateLevel);
            };
            
            updateLevel();
          })
          .catch(err => {

          });
      }
    } catch (err) {

    }
  };

  const startAssessment = async () => {
    if (!recognizerRef.current) {
      setupAudioStream();
    }
    
    try {
      setError(null);
      setIsRecording(true);
      setResult(null);
      
      if (recognizerRef.current) {
        await recognizerRef.current.startContinuousRecognitionAsync();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start assessment';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      setIsRecording(false);
    }
  };

  const stopAssessment = async () => {
    setIsProcessing(true);
    
    try {
      if (recognizerRef.current) {
        await recognizerRef.current.stopContinuousRecognitionAsync();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop assessment';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
    
    setIsRecording(false);
  };


  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stopContinuousRecognitionAsync();
          recognizerRef.current.close();
          recognizerRef.current = null;
        } catch (error) {

        }
      }
    };
  }, []);

  return (
    <Stack gap={rem(24)}>
      <Paper 
        radius="md"
        p="xl"
        style={glassmorphicStyle}
      >
        <Title order={5} mb={rem(12)} fw={500} c="dimmed">
          Reference Text
        </Title>
        <Text fw={500} size="lg" lh={1.6}>
          {referenceText}
        </Text>
      </Paper>

      {!result && (
        <Center my={rem(5)}>
          {!isRecording && !isProcessing && (
            <Button 
              leftSection={<IconMicrophone size={20} />}
              onClick={startAssessment}
              size="lg"
              radius="xl"
              variant="default"
              style={{
                ...glassmorphicButton,
                height: '48px',
                padding: '0 28px',
                borderColor: 'rgba(65, 149, 211, 0.2)'
              }}
            >
              Start Practice
            </Button>
          )}
          
          {isRecording && !isProcessing && (
            <Paper
              radius="md"
              p="md" 
              style={glassmorphicStyle}
            >
              <Group justify="center" mb={rem(16)}>
                <Box style={{ position: 'relative' }}>
                  <IconMicrophone 
                    size={42} 
                    color="#4195d3" 
                    style={{ position: 'relative', zIndex: 5 }}
                  />
                  
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      width: 10,
                      height: 10,
                      backgroundColor: '#ff4757',
                      borderRadius: '50%',
                      zIndex: 6
                    }}
                  />
                </Box>
              </Group>
              <Text fw={600} mb={rem(4)}>Listening...</Text>
              <Button
                leftSection={<IconPlayerStop size={18} />}
                variant="gradient"
                gradient={{ from: '#d64161', to: '#e6854a', deg: 135 }}
                onClick={stopAssessment}
                mt={rem(16)}
                radius="xl"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}
              >
                Stop Recording
              </Button>
            </Paper>
          )}

          {isProcessing && (
            <Center py={rem(20)}>
              <Stack align="center" gap={rem(12)}>
                <Loader size="md" color="#4195d3" />
                <Text size="sm" c="dimmed">Processing your pronunciation...</Text>
              </Stack>
            </Center>
          )}
        </Center>
      )}

      {error && (
        <Paper 
          p="md" 
          radius="md" 
          style={{ 
            backgroundColor: 'rgba(214, 65, 97, 0.15)',
            border: '1px solid rgba(214, 65, 97, 0.3)'
          }}
        >
          <Group gap={8}>
            <IconAlertTriangle size={18} color="#ff6b6b" />
            <Text color="#ff6b6b" size="sm">{error}</Text>
          </Group>
        </Paper>
      )}

      {result && !error && (
        <Stack gap={rem(24)}>
          <Paper 
            radius="md" 
            p="xl"
            style={glassmorphicStyle}
          >
            <Title order={3} mb={rem(20)}>Results</Title>
            
            <Center mb={rem(20)}>
              <RingProgress
                sections={[{ value: result.pronunciationScore, color: getScoreColor(result.pronunciationScore) }]}
                size={150}
                thickness={12}
                roundCaps
                label={
                  <Center>
                    <Stack gap={0} align="center">
                      <Text size="sm" c="dimmed">Overall Score</Text>
                      <Text fw={700} size="xl">{Math.round(result.pronunciationScore)}%</Text>
                    </Stack>
                  </Center>
                }
              />
            </Center>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
              <Stack gap={rem(12)}>
                <Box>
                  <Group justify="space-between" mb={5}>
                    <Text fw={500}>Accuracy</Text>
                    <Text>{Math.round(result.accuracyScore)}%</Text>
                  </Group>
                  <Progress 
                    value={result.accuracyScore} 
                    color="#4195d3" 
                    size="md" 
                    radius="xl" 
                    striped={result.accuracyScore < 60}
                  />
                </Box>
                
                <Box>
                  <Group justify="space-between" mb={5}>
                    <Text fw={500}>Fluency</Text>
                    <Text>{Math.round(result.fluencyScore)}%</Text>
                  </Group>
                  <Progress 
                    value={result.fluencyScore} 
                    color="#43c59e" 
                    size="md" 
                    radius="xl" 
                    striped={result.fluencyScore < 60}
                  />
                </Box>
              </Stack>
              
              <Stack gap={rem(12)}>
                <Box>
                  <Group justify="space-between" mb={5}>
                    <Text fw={500}>Completeness</Text>
                    <Text>{Math.round(result.completenessScore)}%</Text>
                  </Group>
                  <Progress 
                    value={result.completenessScore} 
                    color="#8366d1" 
                    size="md" 
                    radius="xl" 
                    striped={result.completenessScore < 60}
                  />
                </Box>
                
                {result.prosodyScore !== undefined && (
                  <Box>
                    <Group justify="space-between" mb={5}>
                      <Text fw={500}>Rhythm</Text>
                      <Text>{Math.round(result.prosodyScore)}%</Text>
                    </Group>
                    <Progress 
                      value={result.prosodyScore} 
                      color="#e6854a" 
                      size="md" 
                      radius="xl" 
                      striped={result.prosodyScore < 60}
                    />
                  </Box>
                )}
              </Stack>
            </SimpleGrid>
          </Paper>
          
          {result.words && result.words.filter(w => w.accuracyScore < 70).length > 0 && (
            <Paper 
              radius="md" 
              p="xl"
              style={glassmorphicStyle}
            >
              <Title order={4} mb={rem(16)}>Words to Practice</Title>
              <Group>
                {result.words
                  .filter(w => w.accuracyScore < 70)
                  .map((word, index) => (
                    <Badge 
                      key={index} 
                      size="lg"
                      radius="sm"
                      color={getScoreColor(word.accuracyScore).replace('#', '')}
                      variant="filled"
                      style={{
                        textTransform: 'none',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      {word.word} ({Math.round(word.accuracyScore)}%)
                    </Badge>
                  ))}
              </Group>
            </Paper>
          )}
          
          <Group justify="center" gap={rem(12)}>
            <Button
              leftSection={<IconArrowLeft size={18} />}
              variant="default"
              onClick={() => setResult(null)}
              radius="xl"
              style={glassmorphicButton}
            >
              Back to Practice
            </Button>
            <Button
              leftSection={<IconRefresh size={18} />}
              variant="default"
              onClick={startAssessment}
              radius="xl"
              style={{
                ...glassmorphicButton,
                borderColor: 'rgba(131, 102, 209, 0.2)'
              }}
            >
              Try Again
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
};

export default PronunciationAssessment;