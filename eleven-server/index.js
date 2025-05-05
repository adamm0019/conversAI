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

app.get('/api/get-signed-url', async (req, res) => {
  if (!API_KEY) {
    console.error('API key not configured');
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    console.log('Requesting signed URL from Eleven Labs...');
    console.log('Using Agent ID:', AGENT_ID);
    console.log(`API key length: ${API_KEY.length}, first/last characters: ${API_KEY.slice(0, 3)}...${API_KEY.slice(-3)}`);

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

    console.log('Raw response length:', responseText.length);
    console.log('Response status:', response.status);

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
      console.error('Failed to parse response as JSON:', e);
      console.log('Response text excerpt:', responseText.substring(0, 100));
      return res.status(500).json({ error: 'Invalid response format from Eleven Labs API' });
    }

    if (!body.signed_url) {
      console.error('No signed URL in response:', body);
      return res.status(500).json({ error: 'No signed URL in response from Eleven Labs API' });
    }

    console.log('Successfully got signed URL (first 30 chars):', body.signed_url.substring(0, 30) + '...');

    res.json({
      signedUrl: body.signed_url,
      agentId: AGENT_ID,
      timestamp: new Date().toISOString(),
      timeout: WEBSOCKET_TIMEOUT
    });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({
      error: error.message || 'Unknown error occurred while getting signed URL',
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
  console.log('Agent ID:', AGENT_ID);
  console.log('API key configured:', !!API_KEY);
});