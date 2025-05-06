import { useLocalStorage } from '@mantine/hooks';

export interface WordInfo {
  word: string;
  definition: string;
  nativeDefinition?: string;
  grammarRole: string;
  examples: string[];
  audioUrl?: string;
  phoneticText?: string;
  allDefinitions: string[];
  partOfSpeech: string;
}

interface CachedLookup {
  word: string;
  info: WordInfo;
  timestamp: number;
}

// Time to keep cache entries (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Service for language-related operations like word lookups
 */
export class LanguageService {
  private cache: CachedLookup[] = [];
  
  constructor() {
    // Try to initialize cache from localStorage
    try {
      const storedCache = localStorage.getItem('language-inspector-cache');
      if (storedCache) {
        this.cache = JSON.parse(storedCache);
        // Filter out expired entries
        this.cache = this.cache.filter(
          item => (Date.now() - item.timestamp) < CACHE_DURATION
        );
      }
    } catch (error) {
      console.error('Error loading language cache:', error);
      this.cache = [];
    }
  }
  
  /**
   * Save the current cache to localStorage
   */
  private saveCache(): void {
    try {
      localStorage.setItem('language-inspector-cache', JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving language cache:', error);
    }
  }
  
  /**
   * Look up a word using Free Dictionary API
   * @param word - The word to look up
   * @returns Promise with word information
   */
  private async lookupWithDictionaryAPI(word: string): Promise<WordInfo> {
    try {
      console.log(`Looking up "${word}" using Free Dictionary API`);
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Dictionary API error:', response.status, errorData);
        throw new Error(`Dictionary API lookup failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !data[0]) {
        throw new Error('No results found');
      }
      
      // Extract information from the response
      const entry = data[0];
      const meanings = entry.meanings || [];
      const phonetics = entry.phonetics || [];
      
      // Get pronunciation audio URL if available
      const audioUrl = phonetics.find((p: any) => p.audio)?.audio || '';
      
      // Find phonetic text
      const phoneticText = entry.phonetic || 
        phonetics.find((p: any) => p.text)?.text || '';
      
      // Get all definitions and examples across meanings
      let allDefinitions: string[] = [];
      let allExamples: string[] = [];
      let partOfSpeech = '';
      
      // Process all meanings to get rich information
      meanings.forEach((meaning: any, index: number) => {
        // Get the part of speech from the first meaning if not set yet
        if (index === 0 || !partOfSpeech) {
          partOfSpeech = meaning.partOfSpeech || 'Unknown';
        }
        
        // Extract definitions
        const defs = (meaning.definitions || []).map((def: any) => def.definition);
        allDefinitions = [...allDefinitions, ...defs];
        
        // Extract examples
        const examples = (meaning.definitions || [])
          .filter((def: any) => def.example)
          .map((def: any) => def.example);
        allExamples = [...allExamples, ...examples];
        
        // Get synonyms and antonyms
        // We could use these in future versions of the component
        const synonyms = meaning.synonyms || [];
        const antonyms = meaning.antonyms || [];
      });
      
      // Format part of speech to make it more readable
      const formattedPartOfSpeech = partOfSpeech.charAt(0).toUpperCase() + partOfSpeech.slice(1);
      
      // Format grammar role with phonetic text if available
      const grammarRole = phoneticText 
        ? `${formattedPartOfSpeech} ${phoneticText}` 
        : formattedPartOfSpeech;
      
      return {
        word: entry.word || word,
        definition: allDefinitions[0] || 'No definition available',
        grammarRole,
        examples: allExamples.length > 0 
          ? allExamples.slice(0, 3) 
          : ['No examples available'],
        audioUrl, // This is not used directly in WordInfo now, but could be in future
        phoneticText,
        allDefinitions: allDefinitions.slice(0, 3), // We'll keep top 3 definitions
        partOfSpeech: formattedPartOfSpeech
      };
    } catch (error) {
      console.error('Dictionary API error:', error);
      return {
        word,
        definition: 'Definition not available',
        grammarRole: 'Unknown',
        examples: ['No examples available'],
        allDefinitions: [],
        partOfSpeech: 'Unknown'
      };
    }
  }
  
  /**
   * Look up a word using OpenAI API (commented out as mock implementation for now)
   * @param word - The word to look up
   * @param targetLanguage - The language of the word
   * @param nativeLanguage - The user's native language for translation
   * @returns Promise with word information
   */
  private async lookupWithOpenAI(
    word: string, 
    targetLanguage: string = 'English',
    nativeLanguage: string = 'English'
  ): Promise<WordInfo> {
    // This would be the actual OpenAI implementation
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4-turbo",
    //   messages: [
    //     {
    //       role: "system", 
    //       content: `You are a language expert. Provide information about words in JSON format.`
    //     },
    //     {
    //       role: "user",
    //       content: `Provide detailed information about the word "${word}" in ${targetLanguage}.
    //       Include: 
    //       1. Definition in ${targetLanguage}
    //       2. Definition in ${nativeLanguage} 
    //       3. Grammar classification (noun, verb, adjective, etc.)
    //       4. Example sentences using the word
    //       Format as JSON with these fields: definition, nativeDefinition, grammarRole, examples (array)`
    //     }
    //   ],
    //   response_format: { type: "json_object" }
    // });
    
    // Mock implementation for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          word,
          definition: `Example definition for "${word}" in ${targetLanguage}`,
          nativeDefinition: nativeLanguage !== targetLanguage 
            ? `Example translation in ${nativeLanguage}` 
            : undefined,
          grammarRole: word.endsWith('ar') || word.endsWith('er') || word.endsWith('ir') 
            ? 'Verb (Infinitive)' 
            : 'Noun',
          examples: [
            `Example sentence using "${word}".`,
            `Another example with "${word}".`
          ],
          allDefinitions: [`Example definition for "${word}" in ${targetLanguage}`],
          partOfSpeech: word.endsWith('ar') || word.endsWith('er') || word.endsWith('ir') 
            ? 'Verb' 
            : 'Noun'
        });
      }, 500);
    });
  }
  
  /**
   * Get information about a word, using cache if available
   * @param word - The word to look up
   * @param targetLanguage - The language of the word
   * @param nativeLanguage - The user's native language for translation
   * @returns Promise with word information
   */
  async getWordInfo(
    word: string,
    targetLanguage: string = 'English',
    nativeLanguage: string = 'English'
  ): Promise<WordInfo> {
    const normalizedWord = word.toLowerCase().trim();
    
    // Check cache first
    const cachedItem = this.cache.find(
      item => item.word.toLowerCase() === normalizedWord &&
      (Date.now() - item.timestamp) < CACHE_DURATION
    );
    
    if (cachedItem) {
      return cachedItem.info;
    }
    
    // Not in cache, fetch from API
    let wordInfo: WordInfo;
    
    if (targetLanguage.toLowerCase() === 'english') {
      // Use free dictionary API for English words
      wordInfo = await this.lookupWithDictionaryAPI(normalizedWord);
    } else {
      // Use OpenAI for other languages
      wordInfo = await this.lookupWithOpenAI(normalizedWord, targetLanguage, nativeLanguage);
    }
    
    // Update cache
    this.cache = [
      { word: normalizedWord, info: wordInfo, timestamp: Date.now() },
      ...this.cache.filter(item => item.word.toLowerCase() !== normalizedWord)
    ].slice(0, 50); // Keep only 50 most recent lookups
    
    this.saveCache();
    return wordInfo;
  }
}

// Export a singleton instance
export const languageService = new LanguageService(); 