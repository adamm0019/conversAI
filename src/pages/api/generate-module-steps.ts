import express from 'express';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import cors from 'cors';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

router.use(cors());
router.use(express.json());

router.post('/api/openai/generate', async (req, res) => {
  const { prompt, userId, variables } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt parameter' });
  }

  const messages: ChatCompletionMessageParam[] = [
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

  try {
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

export default router; 