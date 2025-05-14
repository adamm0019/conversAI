import { getOpenAIApiKey, OPENAI_CONFIG } from '../config/apiConfig';
import { UserSettings } from '../types';


export interface WordInfo {
  word: string;
  grammarRole: string;
  definition: string;
  nativeDefinition?: string;
  examples: string[];
  synonyms?: string[];
  conjugations?: Record<string, string>;
}


const SYSTEM_PROMPTS: { [langCode: string]: string } = {
  es: "Eres un tutor de idiomas que responde en Español. Ayuda al estudiante a aprender español de manera conversacional.",
  fr: "Vous êtes un tuteur qui répond en français. Aidez l'étudiant à apprendre le français de manière conversationnelle.",
  de: "Du bist ein Sprachlehrer, der auf Deutsch antwortet. Hilf dem Schüler, Deutsch im Gespräch zu lernen.",
  it: "Sei un tutor che risponde in italiano. Aiuta lo studente ad imparare l'italiano in modo conversazionale.",
  pt: "Você é um tutor de idiomas que responde em português. Ajude o aluno a aprender português de forma conversacional.",
  en: "You are a language tutor responding in English. Help the student learn English conversationally."
};

export async function generateAIResponse(
  userMessage: string,
  convoHistory: Array<{ role: string, content: string }>,
  settings: UserSettings
): Promise<string> {

  const messagesPayload = [...convoHistory];


  const langCode = settings.targetLanguageCode;
  if (langCode && SYSTEM_PROMPTS[langCode]) {
    messagesPayload.unshift({
      role: "system",
      content: SYSTEM_PROMPTS[langCode]
    });
  }


  messagesPayload.push({ role: "user", content: userMessage });

  try {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error("Missing OpenAI API key. Please check your environment variables.");
    }


    const model = settings.preferredModel || OPENAI_CONFIG.DEFAULT_MODEL;

    const response = await fetch(OPENAI_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 1500,
        stream: false
      })
    });

    if (!response.ok) {

      const errorData = await response.json().catch(() => null);
      const errorText = errorData ? JSON.stringify(errorData) : await response.text();



      if (response.status === 429) {
        throw new Error("Rate limit reached – please slow down.");
      } else if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenAI API key.");
      } else if (response.status === 404 && model === OPENAI_CONFIG.DEFAULT_MODEL) {


        settings.preferredModel = OPENAI_CONFIG.FALLBACK_MODEL;
        return generateAIResponse(userMessage, convoHistory, settings);
      }

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return content ?? "(No response generated)";
  } catch (err: any) {




    throw new Error(err.message || "Failed to connect to language service. Please try again later.");
  }
}

async function getWordInfo(
  word: string,
  targetLanguage: string,
  nativeLanguage: string
): Promise<WordInfo> {

  const langCodeMap: Record<string, string> = {
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'English': 'en',
  };

  const targetLangCode = langCodeMap[targetLanguage] || 'en';

  try {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error("Missing OpenAI API key. Please check your environment variables.");
    }


    const prompt = `
      You are a language tutor helping with ${targetLanguage} vocabulary.
      Provide detailed information about this word or phrase: "${word}"
      
      Include:
      1. Grammar role (noun, verb, adjective, etc.)
      2. Definition in ${targetLanguage}
      3. Definition in ${nativeLanguage}
      4. 2-3 example sentences using the word
      5. Any relevant synonyms or conjugations
      
      Format as JSON with the following structure:
      {
        "word": "the word",
        "grammarRole": "part of speech",
        "definition": "definition in target language",
        "nativeDefinition": "definition in native language",
        "examples": ["example1", "example2"],
        "synonyms": ["synonym1", "synonym2"],
        "conjugations": {"tense1": "conjugated form", "tense2": "conjugated form"}
      }
    `;

    const response = await fetch(OPENAI_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.FALLBACK_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[targetLangCode] || SYSTEM_PROMPTS.en },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }


    const wordInfo: WordInfo = JSON.parse(content);


    return {
      word: wordInfo.word || word,
      grammarRole: wordInfo.grammarRole || "unknown",
      definition: wordInfo.definition || "No definition available",
      nativeDefinition: wordInfo.nativeDefinition,
      examples: wordInfo.examples || [],
      synonyms: wordInfo.synonyms,
      conjugations: wordInfo.conjugations
    };
  } catch (error: any) {


    return {
      word,
      grammarRole: "unknown",
      definition: "Could not retrieve information",
      examples: []
    };
  }
}


export const languageService = {
  getWordInfo,
  generateAIResponse
};
