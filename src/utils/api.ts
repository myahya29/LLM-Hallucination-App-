import { ModelDefinition } from '../types/benchmark';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ApiKeys {
  openRouterKey: string;
  geminiKey: string;
}

export interface ModelCallResult {
  text: string;
  latencyMs: number;
  retried?: boolean;
}

/**
 * Call OpenRouter API
 */
export async function callOpenRouter(
  apiKey: string,
  modelKey: string,
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Missing OpenRouter API key. Please enter your key in the header.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      'X-Title': 'LLM Hallucination Test',
    },
    body: JSON.stringify({
      model: modelKey,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2, // Low temperature for factual benchmarks
    }),
    signal,
  });

  if (!response.ok) {
    let errBody = '';
    try {
      const json = await response.json();
      errBody = json.error?.message || json.message || JSON.stringify(json);
    } catch {
      errBody = await response.text();
    }

    if (response.status === 429) {
      throw new Error(`Rate limit exceeded (429): ${errBody || 'Too many requests. Please wait.'}`);
    }
    if (response.status === 401) {
      throw new Error(`Authentication error (401): Invalid OpenRouter API key.`);
    }
    throw new Error(`OpenRouter error (${response.status}): ${errBody || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Empty response received from OpenRouter model.');
  }
  return content;
}

/**
 * Call Google Gemini API through the application's server-side endpoint.
 * Supports the user key entered in the input box, and falls back to server env.
 */
export async function callGemini(
  apiKey: string,
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      apiKey: apiKey && apiKey.trim() ? apiKey.trim() : undefined,
    }),
    signal,
  });

  if (!response.ok) {
    let errMessage = '';
    try {
      const errJson = await response.json();
      errMessage = errJson.error || JSON.stringify(errJson);
    } catch {
      errMessage = await response.text();
    }

    if (response.status === 429) {
      throw new Error(`Gemini rate limit (429): ${errMessage}`);
    }
    throw new Error(`Gemini Error: ${errMessage || response.statusText}`);
  }

  const data = await response.json();
  if (typeof data.text !== 'string') {
    throw new Error('No text generated in Gemini response.');
  }
  return data.text;
}

/**
 * Execute request for a single model with 1 automatic retry
 */
export async function executeSingleModelWithRetry(
  model: ModelDefinition,
  prompt: string,
  keys: ApiKeys,
  onStatusChange?: (status: 'calling' | 'retrying') => void,
  signal?: AbortSignal
): Promise<ModelCallResult> {
  const startTime = Date.now();

  const runCall = async () => {
    if (model.provider === 'openrouter') {
      return await callOpenRouter(keys.openRouterKey, model.modelKey, prompt, signal);
    } else if (model.provider === 'gemini') {
      return await callGemini(keys.geminiKey, prompt, signal);
    } else {
      throw new Error('Manual models must have answers pasted manually.');
    }
  };

  try {
    onStatusChange?.('calling');
    const text = await runCall();
    return {
      text,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    // Attempt 1 automatic retry after a short delay
    onStatusChange?.('retrying');
    await sleep(1500);
    const retryStart = Date.now();
    try {
      const text = await runCall();
      return {
        text,
        latencyMs: Date.now() - retryStart,
        retried: true,
      };
    } catch (retryErr: any) {
      throw retryErr;
    }
  }
}
