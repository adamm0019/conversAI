import { useCallback, useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';

interface AudioRecordingState {
  isRecording: boolean;
  audioData: Int16Array | null;
}

export const useAudioRecording = () => {
  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    audioData: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioData = new Int16Array(arrayBuffer);
        setState(prev => ({ ...prev, audioData }));
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
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false }));

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [state.isRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && state.isRecording) {
        stopRecording();
      }
    };
  }, [stopRecording, state.isRecording]);

  return {
    isRecording: state.isRecording,
    audioData: state.audioData,
    startRecording,
    stopRecording,
  };
};
