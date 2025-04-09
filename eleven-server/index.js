import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const AGENT_ID = 'TaDOThYRtPGeAcPDnfys'; // Your ElevenLabs agent ID
const WEBSOCKET_TIMEOUT = 300000; // 5 minutes in milliseconds

// Note: For the server (Node.js), we still use process.env
// Even though you're using Vite for the frontend, this server file uses process.env
// because it runs in Node.js, not the browser
const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVEN_LABS_API_KEY;

// Configure CORS with appropriate options
const corsOptions = {
  origin: '*', // In production, you should limit this to your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'xi-api-key'],
  exposedHeaders: ['Content-Type', 'Authorization', 'xi-api-key'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Pre-flight OPTIONS request handling
app.options('/api/get-signed-url', cors(corsOptions));

// Route to get a signed URL from ElevenLabs
app.get('/api/get-signed-url', async (req, res) => {
  // In Node.js server, we use process.env
  if (!API_KEY) {
    console.error('API key not configured');
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    console.log('Requesting signed URL from Eleven Labs...');
    console.log('Using Agent ID:', AGENT_ID);
    console.log(`API key length: ${API_KEY.length}, first/last characters: ${API_KEY.slice(0, 3)}...${API_KEY.slice(-3)}`);

    // Request a signed URL from the ElevenLabs API
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

    // Get the raw response text first for debugging
    const responseText = await response.text();

    // For debugging purposes (don't log this in production)
    console.log('Raw response length:', responseText.length);
    console.log('Response status:', response.status);

    // Handle error responses from ElevenLabs
    if (!response.ok) {
      console.error('Eleven Labs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 200)  // Only log part of the body
      });

      return res.status(response.status).json({
        error: `Eleven Labs API error: ${response.statusText}`,
        details: responseText
      });
    }

    // Try to parse the response as JSON
    let body;
    try {
      body = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      console.log('Response text excerpt:', responseText.substring(0, 100));
      return res.status(500).json({ error: 'Invalid response format from Eleven Labs API' });
    }

    // Ensure we received a signed_url in the response
    if (!body.signed_url) {
      console.error('No signed URL in response:', body);
      return res.status(500).json({ error: 'No signed URL in response from Eleven Labs API' });
    }

    console.log('Successfully got signed URL (first 30 chars):', body.signed_url.substring(0, 30) + '...');

    // Return the signed URL and related information to the client
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    apiKeyConfigured: !!API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Eleven Labs server listening at http://localhost:${port}`);
  console.log('Agent ID:', AGENT_ID);
  console.log('API key configured:', !!API_KEY);
});