import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3002;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiPath = path.join(__dirname, 'src', 'pages', 'api');

if (fs.existsSync(apiPath)) {
  fs.readdirSync(apiPath).forEach(async (file) => {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      try {
        const filePath = path.join(apiPath, file);
      } catch (error) {
      }
    }
  });
}

app.post('/api/openai/generate', async (req, res) => {
  const { prompt, userId, variables } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt parameter' });
  }

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
      {
        role: 'system',
        content: `You are an expert language tutor specializing in ${variables.language} education. 
        You create personalized learning content for ${variables.language} learners at the ${variables.level} level.
        You always respond with valid JSON that can be parsed by JSON.parse().`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const jsonContent = chat.choices[0].message?.content || '{"steps": []}';
    
    const parsedSteps = JSON.parse(jsonContent);
    
    res.status(200).json(parsedSteps);
  } catch (err) {

    res.status(500).json({ 
      error: 'Failed to generate module steps',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
}); 