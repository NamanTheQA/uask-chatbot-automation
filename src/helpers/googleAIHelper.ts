import { GoogleGenerativeAI } from '@google/generative-ai';

export async function validateWithGoogleAI(
  question: string,
  response: string,
  apiKey: string
) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are an expert at evaluating chatbot responses for a UAE government service chatbot.

Analyze the response and provide your evaluation in JSON format:
{
  "relevanceScore": 0-100,
  "hallucinationDetected": true/false,
  "appropriatenessScore": 0-100,
  "reasoning": "Brief explanation"
}

Evaluation criteria:
1. Relevance (0-100): How well does the answer address the question?
2. Hallucination detection: Does the response contain fabricated information?
3. Appropriateness (0-100): Is the response professional and suitable for government service?
4. Reasoning: Brief explanation of your assessment.`;

    const prompt = `${systemPrompt}

Question: ${question}

Response: ${response}

Provide your evaluation in JSON format:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log('Google AI raw response:', text);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Google AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      llmValidation: {
        relevanceScore: parsed.relevanceScore || 0,
        hallucinationDetected: parsed.hallucinationDetected || false,
        appropriatenessScore: parsed.appropriatenessScore || 0,
        reasoning: parsed.reasoning || 'No reasoning provided',
        model: 'gemini-1.5-flash',
      },
      passed: parsed.relevanceScore >= 70 && 
              parsed.appropriatenessScore >= 70 && 
              !parsed.hallucinationDetected,
      raw: text,
    };
  } catch (error) {
    console.error('Google AI validation failed:', error);
    return {
      llmValidation: {
        relevanceScore: 0,
        hallucinationDetected: false,
        appropriatenessScore: 0,
        reasoning: `Validation failed: ${error}`,
        model: 'gemini-1.5-flash',
      },
      passed: false,
      error: String(error),
    };
  }
}
