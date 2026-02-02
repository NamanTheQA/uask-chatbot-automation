// Functional validation (CI gate)
export function validateAIResponse(text: string) {

  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (!cleaned.length) {
    throw new Error('AI response is empty');
  }

  const fallbackRegex = /(sorry|try again|unable|error|failed)/i;

  if (fallbackRegex.test(cleaned)) {
    throw new Error('Fallback or error response detected');
  }

}


// ------------------ SCORING ENGINE ------------------

type ValidationResult = {
  score: number;
  reasons: string[];
  responseTimeMs: number;
};

export function validateAIResponseScore(
  text: string,
  expectedKeywords: string[],
  responseTimeMs: number
): ValidationResult {

  let score = 0;
  const reasons: string[] = [];

  const cleaned = text.replace(/\s+/g, ' ').trim();

  // Non-empty (25)
  if (cleaned.length > 0) score += 25;
  else reasons.push('Empty response');

  // No fallback (25)
  const fallbackRegex = /(sorry|try again|unable|error|failed)/i;
  if (!fallbackRegex.test(cleaned)) score += 25;
  else reasons.push('Fallback detected');

  // Topic relevance (30)
  const matched = expectedKeywords.some(word =>
    cleaned.toLowerCase().includes(word.toLowerCase())
  );

  if (matched) score += 30;
  else reasons.push('Missing topic keywords');

  // Formatting sanity (20)
  const openTags = (cleaned.match(/</g) || []).length;
  const closeTags = (cleaned.match(/>/g) || []).length;

  if (openTags === closeTags) score += 20;
  else reasons.push('Broken formatting');

  // SLA scoring (20)
  if (responseTimeMs <= 3000) score += 20;
  else if (responseTimeMs <= 7000) score += 10;
  else reasons.push(`Slow response: ${responseTimeMs}ms`);

  return {
    score,
    reasons,
    responseTimeMs
  };
}
