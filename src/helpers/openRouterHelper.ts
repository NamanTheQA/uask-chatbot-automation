import axios from 'axios';
import https from 'https';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models available on OpenRouter
export const FREE_MODELS = {
  LLAMA_3_2_3B: 'meta-llama/llama-3.2-3b-instruct:free',
  LLAMA_3_2_1B: 'meta-llama/llama-3.2-1b-instruct:free',
  GEMINI_FLASH: 'google/gemini-flash-1.5:free',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct:free',
  PHI_3_MINI: 'microsoft/phi-3-mini-128k-instruct:free',
};

// Premium models (require credits on OpenRouter account)
export const PREMIUM_MODELS = {
  GPT_4O_MINI: 'openai/gpt-4o-mini',
  GPT_4O: 'openai/gpt-4o',
  CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet',
  GEMINI_PRO: 'google/gemini-pro-1.5',
};

export interface OpenRouterRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter API with a free model
 * @param apiKey - Your OpenRouter API key (get from https://openrouter.ai/keys)
 * @param request - The request payload
 * @returns The API response
 */
export async function callOpenRouter(
  apiKey: string,
  request: OpenRouterRequest
): Promise<OpenRouterResponse> {
  try {
    const response = await axios.post<OpenRouterResponse>(
      OPENROUTER_API_URL,
      request,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/NamanTheQA/uask-chatbot-automation',
          'X-Title': 'UASK Chatbot Automation',
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // Bypass SSL certificate verification for corporate proxies
        }),
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error('OpenRouter API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(
        `OpenRouter API Error: ${error.response?.status} - ${errorDetails}`
      );
    }
    throw error;
  }
}

export async function validateResponseWithLLM(
  question: string,
  response: string,
  apiKey: string,
  model: string = FREE_MODELS.GEMINI_FLASH
): Promise<{
  relevanceScore: number;
  hallucinationDetected: boolean;
  appropriatenessScore: number;
  reasoning: string;
  raw: string;
}> {
  const systemPrompt = `You are an expert at evaluating chatbot responses for a UAE government service chatbot.
Analyze the response and provide:
1. Relevance score (0-100): How well does the answer address the question?
2. Hallucination detection (true/false): Does the response contain fabricated information?
3. Appropriateness score (0-100): Is the response professional and suitable for government service?
4. Reasoning: Brief explanation of your assessment.

Respond in JSON format:
{
  "relevanceScore": number,
  "hallucinationDetected": boolean,
  "appropriatenessScore": number,
  "reasoning": "explanation"
}`;

  const userPrompt = `Question: ${question}

Chatbot Response: ${response}

Analyze this Q&A pair and provide your assessment.`;

  const llmResponse = await callOpenRouter(apiKey, {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = llmResponse.choices[0]?.message?.content || '{}';

  try {
    // Try to extract JSON from response (some models wrap it in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const result = JSON.parse(jsonStr);

    return {
      relevanceScore: result.relevanceScore || 0,
      hallucinationDetected: result.hallucinationDetected || false,
      appropriatenessScore: result.appropriatenessScore || 0,
      reasoning: result.reasoning || 'No reasoning provided',
      raw: content,
    };

  } catch (error) {
    // If parsing fails, return default values
    console.warn('Failed to parse LLM response:', content);
    return {
      relevanceScore: 50,
      hallucinationDetected: false,
      appropriatenessScore: 50,
      reasoning: `LLM response could not be parsed: ${content}`,
      raw: content,
    };
  }
}

export async function batchValidateResponses(
  qaPairs: Array<{ question: string; response: string }>,
  apiKey: string,
  model: string = FREE_MODELS.GEMINI_FLASH
): Promise<
  Array<{
    question: string;
    response: string;
    validation: Awaited<ReturnType<typeof validateResponseWithLLM>>;
  }>
> {
  const results = [];

  for (const pair of qaPairs) {
    const validation = await validateResponseWithLLM(
      pair.question,
      pair.response,
      apiKey,
      model
    );
    results.push({
      question: pair.question,
      response: pair.response,
      validation,
    });

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}
