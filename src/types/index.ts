export interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

export interface AudioConfig {
  sampleRate: number;
}

export * from './userSettings';
export * from './conversation';
export * from './dynamicVariables';
export * from './connection';
export * from './streak';