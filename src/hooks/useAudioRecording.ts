import { useCallback, useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';

interface AudioRecordingState {
  isRecording: boolean;
  audioData: Int16Array | null;
  rawAudioBuffer: ArrayBuffer | null; // New field for raw audio data
}

interface AudioRecordingOptions {
  onAudioProcessed?: (audioData: Int16Array) => Promise<void>;
  onRawAudioCaptured?: (audioBuffer: ArrayBuffer) => void; // New callback for raw audio
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export const useAudioRecording = (options: AudioRecordingOptions = {}) => {
  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    audioData: null,
    rawAudioBuffer: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize audio context if needed
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
    }
    return audioContextRef.current;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const audioContext = getAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: options.echoCancellation ?? true,
          noiseSuppression: options.noiseSuppression ?? true,
          autoGainControl: options.autoGainControl ?? true,
        }
      });

      // Set up audio processing
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current!);

      // Create new MediaRecorder instance
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stopped
      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

          // Get audio as ArrayBuffer for processing
          const arrayBuffer = await audioBlob.arrayBuffer();

          // Store raw audio buffer for other purposes (like pronunciation assessment)
          setState(prev => ({ ...prev, rawAudioBuffer: arrayBuffer }));

          // Call the callback with the raw audio buffer if provided
          if (options.onRawAudioCaptured) {
            options.onRawAudioCaptured(arrayBuffer);
          }

          // Convert to Int16Array for 11Labs or other processing
          const audioData = new Int16Array(arrayBuffer);
          setState(prev => ({ ...prev, audioData }));

          // Call the audio processed callback if provided
          if (options.onAudioProcessed) {
            await options.onAudioProcessed(audioData);
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          notifications.show({
            title: 'Audio Processing Error',
            message: error instanceof Error ? error.message : 'Failed to process audio recording',
            color: 'red',
          });
        }
      };

      // Start recording
      mediaRecorderRef.current.start();
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Error starting recording:', error);
      notifications.show({
        title: 'Recording Error',
        message: 'Failed to start recording. Please check your microphone permissions.',
        color: 'red',
      });
    }
  }, [getAudioContext, options]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false }));

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [state.isRecording]);

  // Get audio level for visualization
  const getAudioLevel = useCallback(() => {
    if (analyserRef.current && state.isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average level
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      return average / 255; // Normalize to 0-1
    }
    return 0;
  }, [state.isRecording]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && state.isRecording) {
        stopRecording();
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => {
          console.error('Error closing audio context:', err);
        });
      }
    };
  }, [stopRecording, state.isRecording]);

  return {
    isRecording: state.isRecording,
    audioData: state.audioData,
    rawAudioBuffer: state.rawAudioBuffer,
    startRecording,
    stopRecording,
    getAudioLevel
  };
};