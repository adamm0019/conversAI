export const azureSpeechConfig = {
  key: import.meta.env.VITE_AZURE_SPEECH_KEY || '',
  region: import.meta.env.VITE_AZURE_SPEECH_REGION || 'eastus',
  defaultLocale: 'en-US',
  defaultGranularity: 'phoneme' as 'phoneme' | 'word' | 'full',
  enableMiscue: true,
};


export const errorMessages = {
  initializationFailed: 'Failed to initialize Azure Speech SDK',
  permissionDenied: 'Microphone permission denied. Please allow access to continue.',
  serviceError: 'Error connecting to Azure Speech service. Please try again later.',
  recordingError: 'Error during recording. Please try again.',
  noSpeechDetected: 'No speech detected. Please speak clearly and try again.',
  tooQuiet: 'Your voice is too quiet. Please speak louder or move closer to the microphone.',
  incorrectLanguage: 'Speech detected but in wrong language. Please ensure you are speaking the selected language.'
};


export const isAzureConfigValid = (): boolean => {
  return !!azureSpeechConfig.key && !!azureSpeechConfig.region;
};



export const getTestAPIKey = () => {

  if (!azureSpeechConfig.key) {

  }
  return azureSpeechConfig.key;
};

export default azureSpeechConfig; 