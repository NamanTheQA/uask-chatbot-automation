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
│   │   └── ai.score.spec.ts          # AI quality scoring
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

## Test Reports

Reports are generated in `reports/{ENV}/ai/`:
- `ai-score-report.json` - Comprehensive quality scores
- `ai-consistency-report.json` - Response stability metrics
- Individual metric reports (semantic-score-report.json, etc.)

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
| Security | 4 | Partial |
| Accessibility | 3 | Partial |
| **Total** | **24** | **Partial** |

---

**Author:** Naman Bhatia  
**Repository:** [github.com/NamanTheQA/uask-chatbot-automation](https://github.com/NamanTheQA/uask-chatbot-automation)
