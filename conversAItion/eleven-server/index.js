import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const AGENT_ID = 'LclYQZaTV1A9E1fgKwF9';
const WEBSOCKET_TIMEOUT = 300000;

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
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    console.error('API key not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    console.log('Requesting signed URL from Eleven Labs...');
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: "GET",
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
      return res.status(500).json({ error: 'Invalid response format from Eleven Labs API' });
    }

    if (!body.signed_url) {
      console.error('No signed URL in response:', body);
      return res.status(500).json({ error: 'No signed URL in response' });
    }

    console.log('Successfully got signed URL');
    res.json({ 
      signedUrl: body.signed_url,
      agentId: AGENT_ID,
      timestamp: new Date().toISOString(),
      timeout: WEBSOCKET_TIMEOUT
    });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Eleven Labs server listening at http://localhost:${port}`);
  console.log('Agent ID:', AGENT_ID);
  console.log('API key configured:', !!process.env.ELEVEN_LABS_API_KEY);
});