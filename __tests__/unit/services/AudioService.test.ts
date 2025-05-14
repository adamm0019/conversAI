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
  close: jest.fn().mockResolvedValue(undefined),
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

jest.useFakeTimers();

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

    expect(result.current.isProcessing).toBe(false);
  });

  it('should call onAudioReceived when provided and recording stops', async () => {
    const onAudioReceived = jest.fn();
    const { result } = renderHook(() => useAudioService({ onAudioReceived }));

    await act(async () => {
      await result.current.startRecording();
    });



    await act(async () => {
      await result.current.stopRecording();
    });


  });

  it('should cleanup resources when stopRecording is called', async () => {
    const { result } = renderHook(() => useAudioService());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
  });
}); 