import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const AGENT_ID = 'struNpxnJkL8IlMMev4O';

// configuring cors
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};


app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/get-signed-url', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: "GET",
        headers: {
          'xi-api-key': process.env.VITE_ELEVEN_LABS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      console.error('Eleven Labs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      throw new Error(`Failed to get signed URL: ${response.statusText}`);
    }

    let body;
    try {
      body = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Invalid response format from Eleven Labs API');
    }

    console.log('Successfully got signed URL:', body);
    res.json({ signedUrl: body.signed_url });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Text-to-speech endpoint using ElevenLabs
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice_id, model_id } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Default values if not provided
    const voiceId = voice_id || 'EXAVITQu4vr4xnSDxMaL'; // Default voice
    const modelId = model_id || 'eleven_monolingual_v1';
    
    console.log(`Generating speech for text: "${text}" with voice: ${voiceId}`);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.VITE_ELEVEN_LABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to generate speech: ${response.statusText}`);
    }
    
    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Set appropriate headers for audio file
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
    });
    
    // Send the audio data
    res.send(Buffer.from(audioBuffer));
    
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: error.message });
  }
});

app.options('*', cors(corsOptions));

app.listen(port, () => {
  console.log(`Eleven Labs server listening at http://localhost:${port}`);
  console.log('Using API key:', process.env.VITE_ELEVEN_LABS_API_KEY);
  console.log('Using agent ID:', AGENT_ID);
});
