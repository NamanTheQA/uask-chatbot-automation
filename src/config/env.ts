export const ENV = process.env.ENV || 'r9int';

export const baseURLs: Record<string, string> = {
  r9int: 'https://beta-ask.u.ae',
  prod: 'https://ask.u.ae'
};

// OpenRouter API Configuration
// Get your free API key from: https://openrouter.ai/keys
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Google AI Studio API Configuration (FREE)
// Get your free API key from: https://aistudio.google.com/app/apikey
export const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
