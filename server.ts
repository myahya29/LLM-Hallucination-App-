import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// API route for server-side Gemini execution
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Support both: key passed from the UI input box, OR environment variable GEMINI_API_KEY
    const effectiveKey =
      (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0)
        ? apiKey.trim()
        : process.env.GEMINI_API_KEY;

    if (!effectiveKey) {
      return res.status(400).json({
        error:
          'Missing Gemini API key. Please enter your Gemini API key in the top bar or configure it in Settings > Secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Try models: gemini-2.5-flash, gemini-3.8-flash, gemini-flash-latest
    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = response.text;
        if (typeof text === 'string') {
          return res.json({ text, modelUsed: model });
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        // If it's a model not found / 404, try the next model
        if (msg.includes('404') || msg.includes('not found') || msg.includes('NOT_FOUND')) {
          continue;
        }
        // If it's an invalid key or rate limit, fail fast with clear message
        throw err;
      }
    }

    throw lastError || new Error('Failed to generate response from Gemini model.');
  } catch (error: any) {
    let errorMsg = error?.message || 'Server-side Gemini generation failed';
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {
      // Keep original errorMsg if not JSON
    }
    console.error('Gemini error:', errorMsg);
    return res.status(500).json({ error: errorMsg });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile('dist/index.html', { root: '.' });
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
