import express from 'express';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

router.post('/api/ai-modules', async (req, res) => {
  const { target_language, language_level, days_streak, motivation, goal } = req.body;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are a language tutor designing Spanish learning modules. Each module has a title, description, CEFR level (beginner, intermediate, immersion), progress percentage (random), estimated time, and locked status.',
    },
    {
      role: 'user',
      content: `Create a personalized module plan for a user who wants to learn ${target_language}.
      Current level: ${language_level}.
      Streak: ${days_streak} days.
      Motivation: ${motivation || 'unspecified'}.
      Goal: ${goal || 'general fluency'}.
      Return 5 modules in JSON array format with: id, title, description, level, progress (0–100), isLocked (true/false), and timeEstimate (e.g., '15 mins').`,
    },
  ];

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });

    const json = chat.choices[0].message?.content || '[]';
    const modules = JSON.parse(json);
    res.status(200).json({ modules });
  } catch (err) {

    res.status(500).json({ error: 'Failed to generate modules' });
  }
});

export default router;