import axios from 'axios';
import https from 'https';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models available on OpenRouter
export const FREE_MODELS = {
  LLAMA_3_2_3B: 'meta-llama/llama-3.2-3b-instruct:free',
  LLAMA_3_2_1B: 'meta-llama/llama-3.2-1b-instruct:free',
  GEMINI_FLASH: 'google/gemini-flash-1.5-latest',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct:free',
  PHI_3_MINI: 'microsoft/phi-3-mini-128k-instruct:free',
  GEMINI_PRO: 'google/gemini-3-pro-preview'
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
Analyze the response and provide your assessment in valid JSON format only (no markdown, no code blocks).

Return exactly this structure:
{"relevanceScore": 0-100, "hallucinationDetected": true/false, "appropriatenessScore": 0-100, "reasoning": "brief explanation"}

Evaluation criteria:
1. Relevance score (0-100): How well does the answer address the question?
2. Hallucination detection: Does the response contain fabricated information?
3. Appropriateness score (0-100): Is the response professional and suitable for government service?`;

  const userPrompt = `Question: ${question}

Chatbot Response: ${response}

Provide your assessment in JSON format only (no markdown formatting):`;

  const llmResponse = await callOpenRouter(apiKey, {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  let content = llmResponse.choices[0]?.message?.content || '{}';

  try {
    // Remove markdown code block markers if present
    content = content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    
    // Try to extract JSON from response - find first { to last }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace === -1) {
      console.warn('No valid JSON object found in response:', content.substring(0, 300));
      throw new Error('Invalid JSON format - no opening brace found');
    }
    
    let jsonStr = content.substring(firstBrace, lastBrace > firstBrace ? lastBrace + 1 : content.length);
    
    // Try to fix incomplete JSON by closing quotes and braces
    if (lastBrace === -1 || lastBrace <= firstBrace) {
      console.warn('JSON appears incomplete, attempting to fix...', jsonStr.substring(0, 200));
      // If the last character is not a closing brace, try to add one
      jsonStr = jsonStr.trim();
      if (!jsonStr.endsWith('}')) {
        // Check if we have an unclosed string
        const lastQuote = jsonStr.lastIndexOf('"');
        const lastColon = jsonStr.lastIndexOf(':');
        if (lastQuote > lastColon) {
          // Likely incomplete value, add closing quote and brace
          jsonStr += '"}';
        } else {
          jsonStr += '}';
        }
      }
    }
    
    const result = JSON.parse(jsonStr);

    return {
      relevanceScore: result.relevanceScore || 0,
      hallucinationDetected: result.hallucinationDetected || false,
      appropriatenessScore: result.appropriatenessScore || 0,
      reasoning: result.reasoning || 'No reasoning provided',
      raw: content,
    };

  } catch (error) {
    // If parsing fails, try to extract individual fields using regex as last resort
    console.warn('Failed to parse LLM response:', content.substring(0, 300));
    console.error('Parse error:', error);
    
    // Try to extract values using regex
    const relevanceMatch = content.match(/"relevanceScore":\s*(\d+)/);
    const hallucinationMatch = content.match(/"hallucinationDetected":\s*(true|false)/);
    const appropriatenessMatch = content.match(/"appropriatenessScore":\s*(\d+)/);
    const reasoningMatch = content.match(/"reasoning":\s*"([^"]*)/);
    
    if (relevanceMatch || hallucinationMatch || appropriatenessMatch) {
      console.log('Extracted partial values from incomplete JSON');
      return {
        relevanceScore: relevanceMatch ? parseInt(relevanceMatch[1]) : 50,
        hallucinationDetected: hallucinationMatch ? hallucinationMatch[1] === 'true' : false,
        appropriatenessScore: appropriatenessMatch ? parseInt(appropriatenessMatch[1]) : 50,
        reasoning: reasoningMatch ? reasoningMatch[1] : `Partial parse - ${error}`,
        raw: content,
      };
    }
    
    return {
      relevanceScore: 50,
      hallucinationDetected: false,
      appropriatenessScore: 50,
      reasoning: `LLM response could not be parsed: ${error}`,
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
