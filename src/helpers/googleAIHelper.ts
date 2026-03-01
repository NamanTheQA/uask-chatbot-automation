import { GoogleGenAI } from '@google/genai';

export async function validateWithGoogleAI(
  question: string,
  response: string,
  apiKey: string
) {
  try {
    const genAI = new GoogleGenAI({ apiKey });
    const model = await genAI.models.get('gemini-2.0-flash');

    const prompt = `You are an expert at evaluating chatbot responses for a UAE government service chatbot.
Analyze the response and provide your assessment in valid JSON format only (no markdown, no code blocks).

Return exactly this structure:
{"relevanceScore": 0-100, "hallucinationDetected": true/false, "appropriatenessScore": 0-100, "reasoning": "brief explanation"}

Evaluation criteria:
1. Relevance score (0-100): How well does the answer address the question?
2. Hallucination detection: Does the response contain fabricated information?
3. Appropriateness score (0-100): Is the response professional and suitable for government service?

Question: ${question}

Chatbot Response: ${response}

Provide your assessment in JSON format only (no markdown formatting):`;

    const result = await model.generateContent(prompt);
    let text = result.text;
    
    console.log('Google AI raw response:', text.substring(0, 500));

    // Remove markdown code block markers if present
    text = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in response:', text.substring(0, 300));
      throw new Error('Could not parse JSON from Google AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      llmValidation: {
        relevanceScore: parsed.relevanceScore || 0,
        hallucinationDetected: parsed.hallucinationDetected || false,
        appropriatenessScore: parsed.appropriatenessScore || 0,
        reasoning: parsed.reasoning || 'No reasoning provided',
        model: 'gemini-2.0-flash',
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
        model: 'gemini-2.0-flash',
      },
      passed: false,
      error: String(error),
    };
  }
}
