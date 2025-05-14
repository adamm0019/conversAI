import React from 'react';
import { renderHook } from '@testing-library/react';
import { useAudioService } from '../../../src/services/AudioService';


jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn()
  }
}));


describe('useAudioService Hook', () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });



  it.skip('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioService());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.audioLevel).toBe(0);
  });

  it.skip('should start recording when startRecording is called', async () => {

  });

  it.skip('should stop recording when stopRecording is called', async () => {

  });

  it.skip('should call onAudioReceived when provided and recording stops', async () => {

  });

  it.skip('should cleanup resources when cleanup is called', async () => {

  });


  it('should be importable', () => {
    expect(typeof useAudioService).toBe('function');
  });
}); 