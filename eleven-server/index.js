import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const AGENT_ID = 'struNpxnJkL8IlMMev4O';
const WEBSOCKET_TIMEOUT = 300000;
const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVEN_LABS_API_KEY;
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; 

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'xi-api-key'],
  exposedHeaders: ['Content-Type', 'Authorization', 'xi-api-key'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.options('/api/get-signed-url', cors(corsOptions));
app.options('/api/text-to-speech', cors(corsOptions));

app.get('/api/get-signed-url', async (req, res) => {
  if (!API_KEY) {

    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: "GET",
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Eleven Labs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 200)
      });

      return res.status(response.status).json({
        error: `Eleven Labs API error: ${response.statusText}`,
        details: responseText
      });
    }

    let body;
    try {
      body = JSON.parse(responseText);
    } catch (e) {

      return res.status(500).json({ error: 'Invalid response format from Eleven Labs API' });
    }

    if (!body.signed_url) {

      return res.status(500).json({ error: 'No signed URL in response from Eleven Labs API' });
    }

    res.json({
      signedUrl: body.signed_url,
      agentId: AGENT_ID,
      timestamp: new Date().toISOString(),
      timeout: WEBSOCKET_TIMEOUT
    });
  } catch (error) {

    res.status(500).json({
      error: error.message || 'Unknown error occurred while getting signed URL',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/text-to-speech', async (req, res) => {
  if (!API_KEY) {

    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  const { text, voiceId = DEFAULT_VOICE_ID, language } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  try {
    
    let selectedVoiceId = voiceId;
    if (language) {
      const languageVoiceMap = {
        'spanish': 'EXAVITQu4vr4xnSDxMaL', 
        'french': 'ErXwobaYiN019PkySvjV',  
        'german': 'jsCqWAovK2LkecY7zXl4',
      };
      
      if (languageVoiceMap[language.toLowerCase()]) {
        selectedVoiceId = languageVoiceMap[language.toLowerCase()];
      }
    }
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eleven Labs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 200)
      });

      return res.status(response.status).json({
        error: `Eleven Labs API error: ${response.statusText}`,
        details: errorText
      });
    }

    const audioBuffer = await response.arrayBuffer();
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength
    });
    
    res.send(Buffer.from(audioBuffer));
  } catch (error) {

    res.status(500).json({
      error: error.message || 'Unknown error occurred in text-to-speech conversion',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    apiKeyConfigured: !!API_KEY,
    timestamp: new Date().toISOString()
  });
});


app.listen(port, () => {
  console.log(`Eleven Labs server listening at http://localhost:${port}`);
});