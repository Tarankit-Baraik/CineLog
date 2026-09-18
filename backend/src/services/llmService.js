const env = require('../config/env');
const { ExternalAPIError } = require('../utils/AppError');

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5';

// Every prompt this app sends instructs the model to return JSON only - the app never
// regex-scrapes prose out of a response. Malformed JSON is a typed error, not a silent fallback.
async function callLLM(systemPrompt, userPrompt, { maxTokens = 1024 } = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!res.ok) {
    throw new ExternalAPIError(`Claude API request failed (${res.status})`);
  }

  const data = await res.json();
  const text = data.content?.find((block) => block.type === 'text')?.text;
  if (!text) throw new ExternalAPIError('Claude API returned no text content');

  try {
    return JSON.parse(text);
  } catch {
    throw new ExternalAPIError('Claude API returned malformed JSON');
  }
}

module.exports = { callLLM, MODEL };
