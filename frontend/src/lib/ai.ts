import OpenAI from 'openai';

type AIProvider = 'openai' | 'openrouter';

export function getAIClient(): OpenAI {
  const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider;

  if (provider === 'openrouter') {
    return new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY!,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'ResumeForge',
      },
    });
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

export function getModel(shortName: string): string {
  const provider = process.env.AI_PROVIDER || 'openai';
  if (provider === 'openrouter') {
    if (shortName.includes('/')) return shortName;
    return `openai/${shortName}`;
  }
  return shortName;
}

export function validateAIConfig(): string | null {
  const provider = process.env.AI_PROVIDER || 'openai';
  if (provider === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
    return 'OPENROUTER_API_KEY not set. Set it in .env.local or switch AI_PROVIDER to openai.';
  }
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    return 'OPENAI_API_KEY not set. Set it in .env.local or switch AI_PROVIDER to openrouter.';
  }
  return null;
}
