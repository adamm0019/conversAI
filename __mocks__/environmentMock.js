process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.VITE_FIREBASE_APP_ID = 'test-app-id';
process.env.VITE_AZURE_SPEECH_KEY = 'test-azure-key';
process.env.VITE_AZURE_SPEECH_REGION = 'eastus';
process.env.VITE_ELEVEN_API_KEY = 'test-eleven-key';

global.import = {
  meta: {
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
      VITE_FIREBASE_PROJECT_ID: 'test-project-id',
      VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
      VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
      VITE_FIREBASE_APP_ID: 'test-app-id',
      VITE_AZURE_SPEECH_KEY: 'test-azure-key',
      VITE_AZURE_SPEECH_REGION: 'eastus',
      VITE_ELEVEN_API_KEY: 'test-eleven-key',
      MODE: 'test',
    },
  },
};

module.exports = {}; 