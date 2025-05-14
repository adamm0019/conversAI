import { useEffect, useState } from 'react';

export interface AIModule {
  id: string;
  title: string;
  description: string;
  level: string;
  timeEstimate: string;
  isLocked?: boolean;
  progress: number;
}

interface ProfileContextData {
  target_language: string;
  language_level: string;
  days_streak: number;
  motivation?: string;
  goal?: string;
}

export const useModulePlanner = (profile: ProfileContextData | null) => {
  const [modules, setModules] = useState<AIModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    if (!profile) {
      return;
    }


    const fetchModules = async () => {
      setLoading(true);
      setError(null);

      try {

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OpenAI API key is missing');
        }

        const messages = [
          {
            role: 'system',
            content: `You are a language tutor designing learning modules for ${profile.target_language} students. Output JSON only. Do not include markdown formatting.`
          },
          {
            role: 'user',
            content: `Create 5 modules for a ${profile.language_level} level ${profile.target_language} learner with a ${profile.days_streak}-day streak. Motivation: ${profile.motivation || 'general learning'}. Goal: ${profile.goal || 'fluency'}. Return JSON array with: id (string), title (string), description (string), level (string), progress (number, 0–100), isLocked (boolean), and timeEstimate (string).`
          }
        ];


        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();



        let raw = data.choices[0].message.content || '[]';
        raw = raw.replace(/```(?:json)?\n?|```/g, '').trim();

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (parseError) {

          throw new Error('Invalid JSON response from API');
        }


        if (!Array.isArray(parsed)) {
          throw new Error('API response is not an array');
        }


        const validatedModules: AIModule[] = parsed.map((mod, index) => ({
          id: String(mod.id || `module-${index + 1}`),
          title: String(mod.title || `Module ${index + 1}`),
          description: String(mod.description || 'Language learning module'),
          level: String(mod.level || profile.language_level),
          timeEstimate: String(mod.timeEstimate || '15-30 minutes'),
          isLocked: Boolean(mod.isLocked),
          progress: typeof mod.progress === 'number' ? mod.progress : 0
        }));


        setModules(validatedModules);
      } catch (error) {

        setError(error instanceof Error ? error.message : 'Failed to generate modules');


        const fallbackModules: AIModule[] = [
          {
            id: "fallback-1",
            title: "Basic Conversations",
            description: "Practice everyday conversations",
            level: profile.language_level,
            timeEstimate: "15 minutes",
            isLocked: false,
            progress: 0
          },
          {
            id: "fallback-2",
            title: "Essential Vocabulary",
            description: "Learn the most important words",
            level: profile.language_level,
            timeEstimate: "20 minutes",
            isLocked: false,
            progress: 0
          }
        ];
        setModules(fallbackModules);
      } finally {

        setLoading(false);
      }
    };


    fetchModules();
  }, [profile?.target_language, profile?.language_level, profile?.days_streak]);

  return { modules, loading, error };
};
