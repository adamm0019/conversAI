import { useCallback, useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';

interface AudioRecordingState {
  isRecording: boolean;
  audioData: Int16Array | null;
  rawAudioBuffer: ArrayBuffer | null; 
}

interface AudioRecordingOptions {
  onAudioProcessed?: (audioData: Int16Array) => Promise<void>;
  onRawAudioCaptured?: (audioBuffer: ArrayBuffer) => void; 
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

      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current!);

      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      
      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

          
          const arrayBuffer = await audioBlob.arrayBuffer();

          
          setState(prev => ({ ...prev, rawAudioBuffer: arrayBuffer }));

          
          if (options.onRawAudioCaptured) {
            options.onRawAudioCaptured(arrayBuffer);
          }

          
          const audioData = new Int16Array(arrayBuffer);
          setState(prev => ({ ...prev, audioData }));

          
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

      
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [state.isRecording]);

  
  const getAudioLevel = useCallback(() => {
    if (analyserRef.current && state.isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      return average / 255; 
    }
    return 0;
  }, [state.isRecording]);

  
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