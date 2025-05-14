import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../../src/setupTests';
import { useAudioRecording } from '../../../src/hooks/useAudioRecording';


beforeEach(() => {

  const mockMediaRecorder = jest.fn().mockImplementation(() => {
    return {
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: jest.fn(),
      onerror: jest.fn(),
      onstart: jest.fn(),
      onstop: jest.fn(),
      state: 'inactive',
      stream: {
        getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
      },
    };
  });
  jest.mock('MediaRecorder', () => ({
    __esModule: true,
    default: mockMediaRecorder,
    isTypeSupported: jest.fn().mockReturnValue(true),
  }));
  global.MediaRecorder = mockMediaRecorder;
});

describe('useAudioRecording Hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioRecording());
    expect(result.current.isRecording).toBe(false);
    expect(result.current.audioData).toBe(null);
  });

  it('should start and stop recording', async () => {
    const { result } = renderHook(() => useAudioRecording());
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(true);
    await act(async () => {
      await result.current.stopRecording();
    });
    expect(result.current.isRecording).toBe(false);
  });
}); 