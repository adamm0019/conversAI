
const env = {
  VITE_AZURE_SPEECH_KEY: 'test-azure-key',
  VITE_AZURE_SPEECH_REGION: 'eastus',
  VITE_ELEVEN_API_KEY: 'test-eleven-key',
  MODE: 'test',
  
};


if (typeof window !== 'undefined') {
  window.import = {
    meta: {
      env
    }
  };
}

if (typeof global !== 'undefined') {
  global.import = {
    meta: {
      env
    }
  };
}

module.exports = env; 