export function getOpenAIApiKey(): string | undefined {
  return import.meta.env.VITE_OPENAI_API_KEY;
}

export const OPENAI_CONFIG = {
  API_URL: "https://api.openai.com/v1/chat/completions",
  DEFAULT_MODEL: "gpt-4",
  FALLBACK_MODEL: "gpt-3.5-turbo"
}; 