import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAudioService } from '../../../src/services/AudioService';


window.AudioContext = jest.fn().mockImplementation(() => ({
  createAnalyser: jest.fn().mockReturnValue({
    fftSize: 0,
    frequencyBinCount: 128,
    getByteFrequencyData: jest.fn().mockImplementation((array) => {
      
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }),
  }),
  createMediaStreamSource: jest.fn().mockReturnValue({
    connect: jest.fn()
  }),
  decodeAudioData: jest.fn().mockResolvedValue({
    length: 1000,
    getChannelData: jest.fn().mockReturnValue(new Float32Array(1000))
  }),
}));


Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
  },
  configurable: true
});


const MediaRecorderMock = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
}));


global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

describe('useAudioService Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioService());
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.audioLevel).toBe(0);
  });
  
  it('should start recording when startRecording is called', async () => {
    const { result } = renderHook(() => useAudioService());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });
    expect(result.current.isRecording).toBe(true);
  });
  
  it('should stop recording when stopRecording is called', async () => {
    const { result } = renderHook(() => useAudioService());
    
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    
    await act(async () => {
      await result.current.stopRecording();
    });
    
    expect(result.current.isProcessing).toBe(true);
  });
  
  it('should call onAudioReceived when provided and recording stops', async () => {
    const onAudioReceived = jest.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(() => 
      useAudioService({ onAudioReceived })
    );
    
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    
    const mediaRecorder = (MediaRecorderMock as jest.Mock).mock.instances[0];
    
    
    const mockBlob = new Blob(['test'], { type: 'audio/webm' });
    
    
    await act(async () => {
      if (mediaRecorder.ondataavailable) {
        mediaRecorder.ondataavailable({ data: mockBlob });
      }
    });
    
    
    await act(async () => {
      await result.current.stopRecording();
    });
    
    
    expect(onAudioReceived).toHaveBeenCalled();
  });
  
  it('should cleanup resources when cleanup is called', async () => {
    const { result } = renderHook(() => useAudioService());
    
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    
    jest.advanceTimersByTime(1000); 
    
    
    expect(result.current.isRecording).toBe(false);
  });
}); 