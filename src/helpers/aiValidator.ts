import { SEMANTIC_GROUPS } from './semanticDictionary';

export function calculateSemanticScore(text: string) {

  const cleaned = text.toLowerCase();

  let matchCount = 0;
  const totalGroups = Object.keys(SEMANTIC_GROUPS).length;

  for (const groupWords of Object.values(SEMANTIC_GROUPS)) {

    const matched = groupWords.some(word =>
      cleaned.includes(word.toLowerCase())
    );

    if (matched) matchCount++;
  }

  const score = (matchCount / totalGroups) * 100;

  return {
    semanticScore: score,
    matchedGroups: matchCount,
    totalGroups
  };
}

// ------------------ FUNCTIONAL VALIDATION (CI GATE) ------------------

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


// ------------------ HALLUCINATION RISK ENGINE (NEW) ------------------

export function calculateHallucinationRisk(
  text: string,
  expectedKeywords: string[]
) {

  let risk = 0;
  const reasons: string[] = [];

  const cleaned = text.toLowerCase();

  // Missing expected topic keywords
  const keywordMatch = expectedKeywords.some(k =>
    cleaned.includes(k.toLowerCase())
  );

  if (!keywordMatch) {
    risk += 25;
    reasons.push('Possible hallucination: Missing topic keywords');
  }

  // Suspicious confidence claims
  const suspiciousClaims = [
    'guaranteed approval',
    '100% approval',
    'instant approval',
    'always approved'
  ];

  if (suspiciousClaims.some(p => cleaned.includes(p))) {
    risk += 25;
    reasons.push('Possible hallucination: Unrealistic guarantee');
  }

  // Suspicious phone numbers
  if (/\+?\d{8,}/.test(cleaned)) {
    risk += 20;
    reasons.push('Possible hallucination: Suspicious contact number');
  }

  // Missing official UAE source
  const officialDomains = ['gov.ae', 'u.ae'];

  const hasOfficialSource = officialDomains.some(d =>
    cleaned.includes(d)
  );

  if (!hasOfficialSource) {
    risk += 15;
    reasons.push('Low confidence: No official source reference');
  }

  return {
    hallucinationRisk: risk,
    reasons
  };

}


// ------------------ SCORING ENGINE ------------------

type ValidationResult = {
  score: number;
  reasons: string[];
  responseTimeMs: number;
  hallucinationRisk?: number;
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

  const hallucination = calculateHallucinationRisk(
    cleaned,
    expectedKeywords
  );

  if (hallucination.hallucinationRisk > 0) {
    score -= hallucination.hallucinationRisk * 0.4;
    reasons.push(...hallucination.reasons);
  }

  return {
    score: Math.max(score, 0),
    reasons,
    responseTimeMs,
    hallucinationRisk: hallucination.hallucinationRisk
  };

  // ⭐ Semantic scoring bonus
const semantic = calculateSemanticScore(cleaned);

if (semantic.semanticScore > 60) {
  score += 10;
} else if (semantic.semanticScore < 30) {
  reasons.push('Low semantic relevance');
}

}

export function calculateConsistencyScore(
  response1: string,
  response2: string,
  expectedKeywords: string[]
) {

  const r1 = response1.toLowerCase();
  const r2 = response2.toLowerCase();

  let score = 100;
  const reasons: string[] = [];

  // -------------------------
  // Keyword consistency
  // -------------------------
  const keywordMatches1 = expectedKeywords.filter(k => r1.includes(k));
  const keywordMatches2 = expectedKeywords.filter(k => r2.includes(k));

  const overlap = keywordMatches1.filter(k =>
    keywordMatches2.includes(k)
  );

  if (overlap.length === 0) {
    score -= 40;
    reasons.push('No keyword consistency between responses');
  }

  // -------------------------
  // Length drift detection
  // -------------------------
  const lenDiff = Math.abs(r1.length - r2.length);

  if (lenDiff > 200) {
    score -= 20;
    reasons.push('Large response length drift');
  }

  // -------------------------
  // Official domain consistency
  // -------------------------
  const domains = ['gov.ae', 'u.ae'];

  const domainInR1 = domains.some(d => r1.includes(d));
  const domainInR2 = domains.some(d => r2.includes(d));

  if (domainInR1 !== domainInR2) {
    score -= 20;
    reasons.push('Official source inconsistency');
  }

  return {
    consistencyScore: Math.max(score, 0),
    reasons
  };

}
