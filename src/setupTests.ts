import '@testing-library/jest-dom';
import '../__mocks__/environmentMock';
import '../__mocks__/mockModules';


interface IMockAudioContext {
  createAnalyser(): any;
  createMediaStreamSource(): any;
  createGain(): any;
  decodeAudioData(): Promise<any>;
  close(): Promise<void>;
}

interface IMockMediaRecorder {
  start: jest.Mock;
  stop: jest.Mock;
  ondataavailable: ((event: any) => void) | null;
  onstop: ((event: any) => void) | null;
}


class MockAudioContext implements IMockAudioContext {
  createAnalyser() {
    return {
      fftSize: 0,
      connect: jest.fn(),
      frequencyBinCount: 128,
      getByteFrequencyData: jest.fn()
    };
  }

  createMediaStreamSource() {
    return {
      connect: jest.fn()
    };
  }

  createGain() {
    return {
      connect: jest.fn(),
      gain: { value: 1 }
    };
  }

  decodeAudioData() {
    return Promise.resolve({
      length: 1000,
      getChannelData: () => new Float32Array(1000)
    });
  }

  close = jest.fn().mockResolvedValue(undefined);
}


class MockMediaRecorder implements IMockMediaRecorder {
  start: jest.Mock;
  stop: jest.Mock;
  ondataavailable: ((event: any) => void) | null;
  onstop: ((event: any) => void) | null;

  constructor() {
    this.start = jest.fn();
    this.stop = jest.fn();
    this.ondataavailable = null;
    this.onstop = null;
  }

  static isTypeSupported() {
    return true;
  }
}


Object.defineProperty(global, 'AudioContext', {
  value: MockAudioContext,
  writable: true
});

Object.defineProperty(global, 'MediaRecorder', {
  value: MockMediaRecorder,
  writable: true
});


Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  },
  writable: true,
  configurable: true
});


global.requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id: number) => clearTimeout(id);


global.Buffer = global.Buffer || require('buffer').Buffer;