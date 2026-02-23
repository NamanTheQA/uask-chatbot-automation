import { SEMANTIC_GROUPS } from './semanticDictionary';
import { validateResponseWithLLM, FREE_MODELS } from './openRouterHelper';

// Re-export FREE_MODELS for convenience
export { FREE_MODELS } from './openRouterHelper';

// ================================================================
// INDIVIDUAL METRIC FUNCTIONS (Building Blocks)
// ================================================================

// ------------------ SEMANTIC SCORE ------------------
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


// ------------------ HALLUCINATION RISK ------------------
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


// ------------------ CONTEXT PRECISION ------------------
export function calculateContextPrecision(
  aiResponse: string,
  userQuery: string,
  expectedKeywords: string[]
): { precisionScore: number; reasons: string[] } {

  let score = 100;
  const reasons: string[] = [];

  const response = aiResponse.toLowerCase();
  const query = userQuery.toLowerCase();

  // Extract query intent keywords (what user asked about)
  const queryWords = query.split(/\s+/).filter(w => w.length > 3);

  // Check if response addresses the query keywords
  const queryRelevance = queryWords.filter(word => 
    response.includes(word)
  ).length;

  const relevanceRatio = queryWords.length > 0 
    ? (queryRelevance / queryWords.length) * 100 
    : 0;

  if (relevanceRatio < 30) {
    score -= 40;
    reasons.push('Low query relevance: Response does not address query keywords');
  } else if (relevanceRatio < 60) {
    score -= 20;
    reasons.push('Moderate query relevance');
  }

  // Check if expected topic keywords are present
  const topicMatch = expectedKeywords.filter(k => 
    response.includes(k.toLowerCase())
  ).length;

  const topicRatio = expectedKeywords.length > 0
    ? (topicMatch / expectedKeywords.length) * 100
    : 0;

  if (topicRatio < 40) {
    score -= 30;
    reasons.push('Missing expected topic keywords');
  }

  // Check for off-topic content (irrelevant noise)
  const offTopicPatterns = [
    'subscribe', 'follow us', 'like our page', 
    'download our app', 'special offer', 'limited time'
  ];

  const hasOffTopic = offTopicPatterns.some(p => response.includes(p));
  if (hasOffTopic) {
    score -= 20;
    reasons.push('Contains off-topic promotional content');
  }

  // Precision: Does it stay focused on the query?
  const responseLength = response.split(/\s+/).length;
  if (responseLength > 300) {
    score -= 10;
    reasons.push('Response may be too verbose (low precision)');
  }

  return {
    precisionScore: Math.max(score, 0),
    reasons
  };
}


// ------------------ CONTEXT RECALL ------------------
export function calculateContextRecall(
  aiResponse: string,
  expectedKeywords: string[]
): { recallScore: number; reasons: string[] } {

  let score = 100;
  const reasons: string[] = [];

  const response = aiResponse.toLowerCase();

  // Check how many expected keywords are covered
  const coveredKeywords = expectedKeywords.filter(k => 
    response.includes(k.toLowerCase())
  );

  const recallRatio = expectedKeywords.length > 0
    ? (coveredKeywords.length / expectedKeywords.length) * 100
    : 0;

  if (recallRatio < 40) {
    score -= 50;
    reasons.push(`Low recall: Only ${coveredKeywords.length}/${expectedKeywords.length} expected keywords covered`);
  } else if (recallRatio < 70) {
    score -= 25;
    reasons.push(`Moderate recall: ${coveredKeywords.length}/${expectedKeywords.length} expected keywords covered`);
  } else {
    reasons.push(`Good recall: ${coveredKeywords.length}/${expectedKeywords.length} keywords covered`);
  }

  // Check for comprehensive coverage using semantic groups
  const semantic = calculateSemanticScore(response);
  
  if (semantic.semanticScore < 40) {
    score -= 20;
    reasons.push('Low semantic coverage across topic groups');
  }

  // Check if official sources are mentioned (important for recall)
  const officialSources = ['gov.ae', 'u.ae', 'ica', 'federal authority'];
  const hasOfficialSource = officialSources.some(s => response.includes(s));

  if (!hasOfficialSource) {
    score -= 15;
    reasons.push('Missing official source reference');
  }

  return {
    recallScore: Math.max(score, 0),
    reasons
  };
}


// ------------------ ANSWER CORRECTNESS (GROUND TRUTH) ------------------
export function calculateAnswerCorrectness(
  aiResponse: string,
  groundTruth: string,
  expectedKeywords: string[]
): { correctnessScore: number; reasons: string[] } {

  let score = 100;
  const reasons: string[] = [];

  const response = aiResponse.toLowerCase();
  const truth = groundTruth.toLowerCase();

  // Check for factual overlap with ground truth
  const truthWords = truth.split(/\s+/).filter(w => w.length > 4);
  const matchedWords = truthWords.filter(word => response.includes(word));

  const factualOverlap = truthWords.length > 0
    ? (matchedWords.length / truthWords.length) * 100
    : 0;

  if (factualOverlap < 30) {
    score -= 50;
    reasons.push('Low factual overlap with ground truth');
  } else if (factualOverlap < 60) {
    score -= 25;
    reasons.push('Moderate factual overlap with ground truth');
  }

  // Check for keyword alignment
  const keywordMatch = expectedKeywords.filter(k =>
    response.includes(k.toLowerCase())
  ).length;

  const keywordRatio = expectedKeywords.length > 0
    ? (keywordMatch / expectedKeywords.length) * 100
    : 0;

  if (keywordRatio < 50) {
    score -= 30;
    reasons.push('Missing critical expected keywords');
  }

  // Check for contradictions with ground truth
  const contradictionPatterns = [
    { truth: 'free', contradiction: 'fee' },
    { truth: 'required', contradiction: 'not required' },
    { truth: 'online', contradiction: 'in person' }
  ];

  for (const pattern of contradictionPatterns) {
    if (truth.includes(pattern.truth) && response.includes(pattern.contradiction)) {
      score -= 20;
      reasons.push(`Contradiction detected: Response mentions "${pattern.contradiction}" but truth says "${pattern.truth}"`);
    }
  }

  return {
    correctnessScore: Math.max(score, 0),
    reasons
  };
}


// ------------------ FAITHFULNESS TO SOURCE ------------------
export function calculateFaithfulness(
  aiResponse: string,
  expectedSources: string[]
): { faithfulnessScore: number; reasons: string[] } {

  let score = 100;
  const reasons: string[] = [];

  const response = aiResponse.toLowerCase();

  // Check if official sources are cited
  const officialDomains = ['gov.ae', 'u.ae', 'ica.gov.ae', 'federal authority'];
  const citedSources = officialDomains.filter(source => response.includes(source));

  if (citedSources.length === 0) {
    score -= 40;
    reasons.push('No official source citations found');
  } else {
    reasons.push(`Cited sources: ${citedSources.join(', ')}`);
  }

  // Check for expected source references
  if (expectedSources.length > 0) {
    const matchedSources = expectedSources.filter(s =>
      response.includes(s.toLowerCase())
    );

    const sourceRatio = (matchedSources.length / expectedSources.length) * 100;

    if (sourceRatio < 50) {
      score -= 30;
      reasons.push('Missing expected source references');
    }
  }

  // Check for unsourced claims (red flags)
  const unsourcedClaims = [
    'definitely', 'absolutely guaranteed', 'always works',
    'never fails', '100% success', 'instant approval'
  ];

  const hasUnsourcedClaim = unsourcedClaims.some(claim =>
    response.includes(claim)
  );

  if (hasUnsourcedClaim) {
    score -= 25;
    reasons.push('Contains unsourced absolute claims');
  }

  // Check for proper attribution phrases
  const attributionPhrases = [
    'according to', 'as per', 'based on', 'published by',
    'states that', 'mentioned on', 'official website'
  ];

  const hasAttribution = attributionPhrases.some(phrase =>
    response.includes(phrase)
  );

  if (hasAttribution) {
    score += 10; // Bonus for proper attribution
    reasons.push('Contains proper source attribution');
  } else {
    score -= 15;
    reasons.push('Lacks source attribution phrases');
  }

  return {
    faithfulnessScore: Math.max(Math.min(score, 100), 0),
    reasons
  };
}


// ------------------ CONSISTENCY SCORE ------------------
export function calculateConsistencyScore(
  response1: string,
  response2: string,
  expectedKeywords: string[]
) {

  const r1 = response1.toLowerCase();
  const r2 = response2.toLowerCase();

  let score = 100;
  const reasons: string[] = [];

  // Keyword consistency
  const keywordMatches1 = expectedKeywords.filter(k => r1.includes(k));
  const keywordMatches2 = expectedKeywords.filter(k => r2.includes(k));

  const overlap = keywordMatches1.filter(k =>
    keywordMatches2.includes(k)
  );

  if (overlap.length === 0) {
    score -= 40;
    reasons.push('No keyword consistency between responses');
  }

  // Length drift detection
  const lenDiff = Math.abs(r1.length - r2.length);

  if (lenDiff > 200) {
    score -= 20;
    reasons.push('Large response length drift');
  }

  // Official domain consistency
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


// ================================================================
// FUNCTIONAL VALIDATION (CI GATE)
// ================================================================

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


// ================================================================
// COMPREHENSIVE VALIDATION ORCHESTRATOR
// ================================================================

type ValidationResult = {
  score: number;
  reasons: string[];
  responseTimeMs: number;
  hallucinationRisk?: number;
  contextPrecision?: number;
  contextRecall?: number;
  answerCorrectness?: number;
  faithfulness?: number;
};

export function validateAIResponseScore(
  text: string,
  expectedKeywords: string[],
  responseTimeMs: number,
  userQuery?: string,
  groundTruth?: string,
  expectedSources?: string[]
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

  // Semantic scoring bonus
  const semantic = calculateSemanticScore(cleaned);

  if (semantic.semanticScore > 60) {
    score += 10;
  } else if (semantic.semanticScore < 30) {
    reasons.push('Low semantic relevance');
  }

  // Hallucination penalty
  const hallucination = calculateHallucinationRisk(
    cleaned,
    expectedKeywords
  );

  if (hallucination.hallucinationRisk > 0) {
    score -= hallucination.hallucinationRisk * 0.4;
    reasons.push(...hallucination.reasons);
  }

  // Calculate Context Precision (if query provided)
  let precisionScore = 0;
  if (userQuery) {
    const precision = calculateContextPrecision(cleaned, userQuery, expectedKeywords);
    precisionScore = precision.precisionScore;
    if (precisionScore < 70) {
      reasons.push(...precision.reasons);
    }
  }

  // Calculate Context Recall
  const recall = calculateContextRecall(cleaned, expectedKeywords);
  const recallScore = recall.recallScore;
  if (recallScore < 70) {
    reasons.push(...recall.reasons);
  }

  // Calculate Answer Correctness (if ground truth provided)
  let correctnessScore = 0;
  if (groundTruth) {
    const correctness = calculateAnswerCorrectness(cleaned, groundTruth, expectedKeywords);
    correctnessScore = correctness.correctnessScore;
    if (correctnessScore < 70) {
      reasons.push(...correctness.reasons);
    }
  }

  // Calculate Faithfulness (if expected sources provided)
  let faithfulnessScore = 0;
  if (expectedSources && expectedSources.length > 0) {
    const faithfulness = calculateFaithfulness(cleaned, expectedSources);
    faithfulnessScore = faithfulness.faithfulnessScore;
    if (faithfulnessScore < 70) {
      reasons.push(...faithfulness.reasons);
    }
  }

  return {
    score: Math.max(score, 0),
    reasons,
    responseTimeMs,
    hallucinationRisk: hallucination.hallucinationRisk,
    contextPrecision: precisionScore,
    contextRecall: recallScore,
    answerCorrectness: correctnessScore || undefined,
    faithfulness: faithfulnessScore || undefined
  };

}

// ================================================================
// LLM-BASED VALIDATION (OpenRouter Integration)
// ================================================================

/**
 * Validate response using OpenRouter free LLM models
 * Provides AI-powered validation for relevance, hallucination, and appropriateness
 * @param question - The user's question
 * @param response - The chatbot's response
 * @param apiKey - OpenRouter API key (optional, uses env var if not provided)
 * @param model - Free model to use (defaults to Gemini Flash)
 */
export async function validateWithOpenRouter(
  question: string,
  response: string,
  apiKey?: string,
  model: string = FREE_MODELS.GEMINI_FLASH
) {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  
  if (!key) {
    throw new Error('OpenRouter API key not provided. Set OPENROUTER_API_KEY in .env file or pass as parameter.');
  }

  try {
    const result = await validateResponseWithLLM(question, response, key, model);
    
    return {
      llmValidation: {
        relevanceScore: result.relevanceScore,
        hallucinationDetected: result.hallucinationDetected,
        appropriatenessScore: result.appropriatenessScore,
        reasoning: result.reasoning,
        model,
      },
      passed: result.relevanceScore >= 70 && 
              result.appropriatenessScore >= 70 && 
              !result.hallucinationDetected,
      raw: result.raw,
    };
  } catch (error) {
    console.error('OpenRouter validation failed:', error);
    return {
      llmValidation: {
        relevanceScore: 0,
        hallucinationDetected: false,
        appropriatenessScore: 0,
        reasoning: `Validation failed: ${error}`,
        model,
      },
      passed: false,
      error: String(error),
    };
  }
}

/**
 * Enhanced comprehensive validation combining traditional metrics + LLM validation
 * @param question - The user's question
 * @param response - The chatbot's response  
 * @param options - Validation options including OpenRouter config
 */
export async function validateAIResponseWithLLM(
  question: string,
  response: string,
  options: {
    expectedKeywords: string[];
    expectedSources?: string[];
    responseTimeMs: number;
    minScore?: number;
    openRouterApiKey?: string;
    openRouterModel?: string;
    useLLM?: boolean;
  }
) {
  // Run traditional validation
  const traditionalValidation = validateAIResponseScore(
    response,
    options.expectedKeywords,
    options.responseTimeMs,
    question,
    undefined, // groundTruth
    options.expectedSources
  );

  // Run LLM validation if enabled
  let llmValidation;
  if (options.useLLM !== false) {
    llmValidation = await validateWithOpenRouter(
      question,
      response,
      options.openRouterApiKey,
      options.openRouterModel
    );
  }

  return {
    traditional: traditionalValidation,
    llm: llmValidation,
    overallPassed: traditionalValidation.score >= (options.minScore || 60) && 
                   (llmValidation?.passed !== false),
  };
}
