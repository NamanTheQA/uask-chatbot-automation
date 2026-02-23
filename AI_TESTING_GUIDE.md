# AI Testing Guide - U-Ask Chatbot

## Quick Reference for Interview

### 1. AI Quality Metrics Overview

#### A. Context Precision (0-100)
**What it measures:** How focused and relevant the AI response is to the user's query.

**Algorithm:**
```typescript
- Extract keywords from user query
- Check if keywords appear in response (relevance check)
- Detect off-topic content (verbosity penalty)
- Calculate: (relevant_keywords / total_keywords) × 100
```

**Example:**
- Query: "How to renew UAE visa?"
- Good Response: Talks about visa renewal process → High precision (90+)
- Bad Response: Generic info about UAE tourism → Low precision (30-)

---

#### B. Context Recall (0-100)
**What it measures:** How comprehensive the response is - does it cover all expected topics?

**Algorithm:**
```typescript
- Define expected keywords for the query domain
- Check coverage of semantic keyword groups
- Verify official source mentions
- Calculate: (covered_keywords / expected_keywords) × 100
```

**Example:**
- Query: "Check visa status"
- Expected: visa, ICA portal, tracking, status
- Response covers 3/4 → Recall = 75%

---

#### C. Answer Correctness (0-100)
**What it measures:** Factual accuracy compared to ground truth.

**Algorithm:**
```typescript
- Compare response to known correct answer (ground truth)
- Check keyword overlap
- Detect contradictions
- Score based on factual alignment
```

**Example:**
- Ground Truth: "Use ICA portal at ica.gov.ae"
- Response: "Visit ICA website" → 80% correct
- Response: "Call 999" → 20% correct (wrong info)

---

#### D. Faithfulness to Source (0-100)
**What it measures:** Does the AI cite official UAE government sources?

**Algorithm:**
```typescript
- Search for official domains (gov.ae, u.ae, ica.gov.ae)
- Look for source attribution phrases ("according to", "official")
- Penalty for unsourced claims
- Calculate: (sources_found / expected_sources) × 100
```

**Example:**
- Good: "According to ICA (ica.gov.ae), visa takes 3 days"
- Bad: "Visa usually takes 3 days" (no source)

---

#### E. Hallucination Detection (0-100 risk score)
**What it measures:** Does AI fabricate information or provide unrealistic claims?

**Risk Factors:**
```typescript
+25 → Missing topic keywords (talking about wrong subject)
+25 → Unrealistic claims ("100% guaranteed approval")
+20 → Suspicious contact info (fake numbers/emails)
+15 → No official UAE source mentioned
+10 → Generic filler content
```

**Example:**
- Low Risk (10): Cites ICA.gov.ae with accurate info
- High Risk (85): "Call 555-1234 for instant visa, 100% success!"

---

#### F. Consistency Score (0-100)
**What it measures:** Does AI give same answer for similar questions in different languages?

**Algorithm:**
```typescript
- Ask same question in EN and AR
- Extract keywords from both responses
- Compare keyword overlap and semantic similarity
- Calculate: (matching_keywords / total_keywords) × 100
```

**Example:**
- EN: "Visit ICA portal for visa status"
- AR: "زيارة بوابة ICA للتحقق من حالة التأشيرة"
- Consistent → 95+ score

---

### 2. AI Testing Architecture

```
aiValidator.ts (Scoring Engine)
    ├── calculateContextPrecision()
    ├── calculateContextRecall()
    ├── calculateAnswerCorrectness()
    ├── calculateFaithfulness()
    ├── calculateHallucinationRisk()
    └── calculateConsistencyScore()

semanticDictionary.ts (Domain Keywords)
    ├── visaKeywords[]
    ├── residencyKeywords[]
    ├── healthcareKeywords[]
    └── officialSources[]

ai-prompts.json (Test Data)
    ├── id: "visa-status"
    ├── text: "How can I check UAE visa status?"
    ├── keywords: ["visa", "status", "UAE"]
    ├── groundTruth: "Use ICA portal..."
    └── expectedSources: ["ica.gov.ae"]
```

---

### 3. Test Implementation Flow

**File: `tests/ai/ai.score.spec.ts`**

```typescript
1. Load test prompts from ai-prompts.json
2. For each prompt:
   a. Send message to chatbot
   b. Extract AI response
   c. Calculate all 6 metrics:
      - Context Precision
      - Context Recall
      - Answer Correctness
      - Faithfulness
      - Hallucination Risk
      - (Consistency checked separately)
   d. Generate score report
3. Save results to reports/{ENV}/ai/ai-score-report.json
```

---

### 4. Sample Test Data Structure

```json
{
  "id": "visa-status",
  "text": "How can I check UAE visa status?",
  "keywords": ["visa", "UAE", "status", "check", "ICA"],
  "groundTruth": "You can check UAE visa status through ICA portal at ica.gov.ae",
  "expectedSources": ["ica.gov.ae", "federal authority", "ICA"]
}
```

---

### 5. Scoring Thresholds (score-config.json)

```json
{
  "minAcceptableScore": 70,
  "maxHallucinationRisk": 30,
  "minContextPrecision": 75,
  "minContextRecall": 70,
  "minAnswerCorrectness": 75,
  "minFaithfulness": 65,
  "minConsistency": 80
}
```

---

### 6. Key Interview Talking Points

**Q: How do you test AI quality?**
- "I use 6 RAG evaluation metrics: Context Precision, Recall, Answer Correctness, Faithfulness, Hallucination Detection, and Consistency"

**Q: What's the difference between Precision and Recall?**
- "Precision checks if the response is focused (no irrelevant info)"
- "Recall checks if the response is complete (covers all topics)"

**Q: How do you detect hallucinations?**
- "I check for missing keywords, unrealistic claims, fake contact info, and lack of official sources"

**Q: How do you validate multilingual AI?**
- "I compare keyword overlap between EN and AR responses using consistency scoring"

**Q: What's your test data strategy?**
- "I use ground truth validation - compare AI responses against known correct answers from official sources"

---

### 7. Sample Output Report

```json
{
  "id": "visa-status",
  "question": "How can I check UAE visa status?",
  "response": "You can check your visa status on ICA portal...",
  "score": 85,
  "hallucinationRisk": 15,
  "contextPrecision": 90,
  "contextRecall": 80,
  "answerCorrectness": 85,
  "faithfulness": 75,
  "responseTimeMs": 2450,
  "timestamp": "2026-02-18T10:30:00Z",
  "issues": ["Low confidence: No official source reference"]
}
```

---

### 8. Semantic Dictionary Categories

```typescript
export const keywordGroups = {
  visa: ['visa', 'تأشيرة', 'entry permit', 'ICA', 'immigration'],
  residency: ['residence', 'إقامة', 'golden visa', 'emirates ID'],
  healthcare: ['health', 'صحة', 'hospital', 'medical insurance'],
  education: ['education', 'تعليم', 'university', 'school'],
  business: ['business', 'أعمال', 'license', 'trade']
};

export const officialSources = [
  'gov.ae', 'u.ae', 'ica.gov.ae', 'mohre.gov.ae',
  'federal authority', 'government portal', 'official'
];
```

---

### 9. When Each Metric Fails

| Metric | Fails When | Example |
|--------|-----------|---------|
| Precision | Response talks about unrelated topics | Asked about visa, talks about tourism |
| Recall | Response misses key information | Forgets to mention ICA portal |
| Correctness | Response contradicts ground truth | Wrong website URL |
| Faithfulness | No official source cited | Just says "usually takes 3 days" |
| Hallucination | Fabricates info or makes false claims | "100% guaranteed in 1 hour" |
| Consistency | EN and AR responses differ | Different steps in each language |

---

## Quick Command Reference

```bash
# Run AI functional tests
npm run test:ai

# Run AI quality scoring
npm run test:score

# View AI reports
cat reports/r9int/ai/ai-score-report.json
```
