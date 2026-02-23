# U-Ask Chatbot Automation

Automated test suite for UAE Government's U-Ask AI chatbot using Playwright and TypeScript.

## What This Tests

**UI Tests**
- Chat widget loading and display
- Message sending and receiving
- Language toggle (English/Arabic with RTL support)
- Input clearing and scroll behavior
- Mobile responsiveness

**AI Response Tests**
- Answer quality and relevance
- Hallucination detection
- Response consistency
- Semantic scoring
- Ground truth validation
- Source citation checking
- **LLM-based validation** (OpenRouter integration)

**Security Tests**
- XSS prevention
- Prompt injection handling
- SQL injection resistance
- Special character sanitization

**Accessibility Tests**
- WCAG compliance
- Keyboard navigation
- Screen reader support

---

## Project Structure

```
uask-chatbot-automation/
├── src/
│   ├── config/
│   │   └── env.ts                    # Environment configuration
│   ├── helpers/
│   │   ├── a11y.ts                   # Accessibility validator
│   │   ├── aiValidator.ts            # AI response scoring engine
│   │   ├── openRouterHelper.ts       # LLM API integration
│   │   ├── reportHelper.ts           # Report generation
│   │   └── semanticDictionary.ts     # Domain-specific keywords
│   ├── pages/
│   │   ├── BasePage.ts               # Base page object
│   │   ├── ChatbotPage.ts            # Main chatbot POM
│   │   ├── ChatActions.ts            # User actions
│   │   ├── ChatLocators.ts           # Element selectors
│   │   └── ChatDataExtractor.ts      # Response extraction
│   └── test-data/
│       ├── test-data.json            # UI test data (EN & AR)
│       ├── ui-data.json              # UI validation data
│       ├── ai-data.json              # AI query test data
│       ├── ai-prompts.json           # AI scoring prompts
│       ├── security-data.json        # Security test payloads
│       ├── a11y-config.json          # Accessibility rules
│       └── score-config.json         # AI scoring thresholds
├── tests/
│   ├── ui/
│   │   ├── ui.spec.ts                # UI behavior tests
│   │   └── multilingual.spec.ts      # Language toggle tests
│   ├── ai/
│   │   ├── ai.spec.ts                # AI functional tests
│   │   ├── ai.score.spec.ts          # AI quality scoring
│   │   └── ai.llm.spec.ts            # LLM-based validation
│   ├── security/
│   │   └── security.spec.ts          # Security validation
│   └── accessibility/
│       └── a11y.spec.ts              # Accessibility tests
├── playwright.config.ts              # Playwright configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

## Setup

**Requirements**
- Node.js 18+
- npm

**Install**
```bash
git clone https://github.com/NamanTheQA/uask-chatbot-automation.git
cd uask-chatbot-automation
npm install
npx playwright install

# Optional: Setup OpenRouter for LLM validation
# 1. Get free API key from https://openrouter.ai/keys
# 2. Create .env file:
cp .env.example .env
# 3. Add your API key to .env:
OPENROUTER_API_KEY=your_key_here
```

## Running Tests

```bash
# All tests
npx playwright test

# Specific suite
npx playwright test tests/ui/
npx playwright test tests/ai/

# With browser visible
npx playwright test --headed

# Specific browser
npx playwright test --project=chromium
```

## AI Quality Metrics

The framework validates AI responses using these metrics:

**Traditional Metrics (Keyword/Pattern-Based)**

**Hallucination Detection**
Checks for fabricated content like fake phone numbers, unrealistic guarantees, or missing expected keywords.

**Context Precision**
Measures if the response stays focused on the user's question without going off-topic.

**Context Recall**
Checks if the response covers all expected information and keywords.

**Answer Correctness**
Compares AI response against known correct answers to detect factual errors.

**Faithfulness**
Verifies that responses cite official UAE government sources (gov.ae, u.ae, ica.gov.ae).

**Semantic Score**
Measures topic diversity across visa, status, application, and UAE-related content.

**LLM-Based Validation (OpenRouter Integration)**

Uses free AI models to validate responses:
- **Relevance Score**: How well the answer addresses the question (0-100)
- **Hallucination Detection**: AI-powered fabrication detection
- **Appropriateness Score**: Professional and suitable for government service (0-100)
- **Reasoning**: Detailed explanation of the assessment

**Available Free Models**:
- Google Gemini Flash 1.5
- Meta Llama 3.2 (3B, 1B)
- Mistral 7B
- Microsoft Phi-3 Mini

**Benefits**:
- More sophisticated validation than keyword matching
- Understands context and nuance
- Detects subtle quality issues
- No cost (free tier models)


## Test Reports

Reports are generated in `reports/{ENV}/ai/`:
- `ai-score-report.json` - Comprehensive quality scores
- `ai-consistency-report.json` - Response stability metrics
- Individual metric reports (semantic-score-report.json, etc.)
- **LLM validation reports**:
  - `llm-single-validation.json` - Single response LLM validation
  - `llm-enhanced-validation.json` - Combined traditional + LLM
  - `llm-batch-validation.json` - Batch validation results
  - `llm-model-comparison.json` - Free model performance comparison

View HTML report:
```bash
npx playwright show-report
```

## Configuration

Environments are configured in `src/config/env.ts`:
- **r9int**: https://beta-ask.u.ae (default)
- **prod**: https://ask.u.ae

Change environment:
```bash
ENV=prod npx playwright test
```

## Known Issues

Tests may fail intermittently due to CAPTCHA on the chatbot. For consistent results, consider IP whitelisting or using a test environment.

## Test Summary

| Category | Tests | Status |
|----------|-------|--------|
| UI Behavior | 7 | Partial |
| Multilingual | 2 | Partial |
| AI Quality | 8 | Partial |
| AI LLM Validation | 4 | New |
| Security | 4 | Partial |
| Accessibility | 3 | Partial |
| **Total** | **28** | **Partial** |

---

**Author:** Naman Bhatia  
**Repository:** [github.com/NamanTheQA/uask-chatbot-automation](https://github.com/NamanTheQA/uask-chatbot-automation)
