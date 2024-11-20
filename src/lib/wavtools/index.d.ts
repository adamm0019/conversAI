export class WavRecorder {
    stream: MediaStream | null;
    processor: AudioWorkletNode | null;
    source: MediaStreamAudioSourceNode | null;
    node: AudioNode | null;
    recording: boolean;
  
    getStatus(): 'recording' | 'ended' | 'paused';
    pause(): Promise<void>;
    end(): Promise<void>;
  }
  
  export class WavStreamPlayer {
    interrupt(): Promise<void>;
  }