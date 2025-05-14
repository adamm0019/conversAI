import { getOpenAIApiKey, OPENAI_CONFIG } from '../config/apiConfig';
import { AIModule } from '../hooks/useModulePlanner';

export interface ModuleStep {
  id?: string;
  instruction: string;
  phrase: string;
  translation?: string;
  skillType: 'pronunciation' | 'vocabulary' | 'grammar' | 'comprehension' | 'listening';
  completed?: boolean;
  userResponse?: string;
  feedback?: string;
}

export async function generateModuleSteps(
  moduleData: AIModule, 
  language: string, 
  level: string
): Promise<ModuleStep[]> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
    
    const prompt = `
      Create 5 learning steps for a language module with the following details:
      - Title: ${moduleData.title}
      - Target language: ${language}
      - User's proficiency level: ${level}
      
      For each step, include:
      1. An instruction to guide the learner
      2. A phrase in ${language} to practice
      3. A translation of the phrase in English
      4. A skill type (pronunciation, vocabulary, grammar, comprehension, or listening)
      
      Return the response as a JSON object with a 'steps' array containing objects with these properties:
      {
        "steps": [
          {
            "instruction": "string",
            "phrase": "string",
            "translation": "string",
            "skillType": "pronunciation|vocabulary|grammar|comprehension|listening"
          }
        ]
      }
    `;
    
    try {
      const response = await fetch(`${API_URL}/api/openai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          variables: {
            language,
            level
          }
        })
      });
      
      if (response.ok) {
        const parsedData = await response.json();
        
        if (parsedData.steps && Array.isArray(parsedData.steps) && parsedData.steps.length > 0) {
          return parsedData.steps;
        }
      }
      
    } catch (err) {
      }
    
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const response = await fetch(OPENAI_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert language tutor specializing in ${language} education. 
            You create personalized learning content for ${language} learners at the ${level} level.
            You always respond with valid JSON that can be parsed by JSON.parse().`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    const parsedData = JSON.parse(content);
    
    if (!parsedData.steps || !Array.isArray(parsedData.steps) || parsedData.steps.length === 0) {
      throw new Error('Invalid steps data in OpenAI response');
    }
    
    return parsedData.steps;
  } catch (err) {

    throw err;
  }
}