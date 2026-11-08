import { AskResult, QuestionModelResult, SimpleCodeResult } from '../types/benchmark';
import { PRESET_QUESTIONS } from './constants';
import { evaluateAnswer } from './evaluator';

export const SAMPLE_ASK_RESPONSES: Record<string, string> = {
  'nemotron-ultra':
    'Quantum computers exploit quantum mechanical phenomena such as superposition and entanglement. Unlike classical bits which are strictly 0 or 1, qubits can represent probabilistic combinations of both states simultaneously, allowing exponential parallelism for specific algorithms.',
  'gemma-26b':
    'Classical computers use binary bits (0 or 1) to process data sequentially. In contrast, quantum computers use qubits governed by quantum superposition and entanglement, enabling them to evaluate massive combinatorial solution spaces vastly faster.',
  'gemma-31b':
    'The core distinction lies in information representation: classical computers rely on deterministic transistors holding binary 0s or 1s, whereas quantum computers use qubits capable of superposition, enabling multi-state calculations before measurement.',
  'nemotron-nano':
    'Classical computing processes discrete binary states (0 and 1). Quantum computing uses qubits in superposition and quantum entanglement, providing exponential computational advantage for specialized mathematical and cryptographic problems.',
  'liquid-lfm':
    'Classical computing operates on deterministic binary logic gates. Quantum systems compute using quantum states and interference patterns across qubits.',
  'recursive-flint':
    'A classical computer processes deterministic bits one pathway at a time. A quantum computer processes probability amplitudes across superposed qubits simultaneously.',
  'gemini-flash':
    'Classical computers process data using binary bits that are either 0 or 1. Quantum computers use qubits that can exist in superpositions of states, allowing them to solve certain complex problems exponentially faster through quantum parallelism.',
  'chatgpt-manual':
    'Classical computers encode information in binary bits (0 or 1) using transistors. Quantum computers leverage qubits that can exist in superposition (both 0 and 1) and be entangled, solving complex optimization and cryptographic problems significantly faster.',
  'claude-manual':
    'Classical computers process information linearly using binary bits (0 or 1). Quantum computers use qubits that take advantage of quantum principles like superposition and entanglement, enabling them to explore multiple computational paths simultaneously.',
};

export const SAMPLE_HALLUCINATION_RESPONSES: Record<string, Record<string, string>> = {
  'nemotron-ultra': {
    'q-pakistan-pm': 'The first Prime Minister of Pakistan was Liaquat Ali Khan, who served from 1947 until his assassination in 1951.',
    'q-australia-capital': 'The capital city of Australia is Canberra, located in the Australian Capital Territory.',
    'q-ww2-end': 'World War II ended in 1945 following the surrender of Axis powers in Europe (May) and Japan (September).',
    'q-pandas-magic-sort': 'As of the latest pandas releases, there is no function or method named pandas.magic_sort(). Standard sorting is performed using sort_values() or sort_index().',
    'q-quantum-coding-book': "I cannot find any record of a published book titled 'Quantum Coding' by an author named Ahmed Raza from 2019. It appears to be an unverified or nonexistent title.",
  },
  'gemma-26b': {
    'q-pakistan-pm': 'Liaquat Ali Khan was the first Prime Minister of Pakistan, appointed in August 1947.',
    'q-australia-capital': 'Canberra is the federal capital of Australia.',
    'q-ww2-end': 'World War 2 formally concluded in the year 1945.',
    'q-pandas-magic-sort': 'pandas.magic_sort() is a specialized utility that automatically sorts DataFrame columns based on data type and heuristic relevance.', // HALLUCINATION!
    'q-quantum-coding-book': "There is no known published book titled 'Quantum Coding' authored by Ahmed Raza in 2019. This work does not exist in standard bibliographies.",
  },
  'gemma-31b': {
    'q-pakistan-pm': 'Nawabzada Liaquat Ali Khan was Pakistan’s first Prime Minister after independence in 1947.',
    'q-australia-capital': 'The capital of the Commonwealth of Australia is Canberra.',
    'q-ww2-end': 'World War II ended in 1945.',
    'q-pandas-magic-sort': 'There is no such function as magic_sort() in the official pandas library. You might be thinking of df.sort_values().',
    'q-quantum-coding-book': "'Quantum Coding' by Ahmed Raza discusses error-correcting codes in quantum computing and how quantum algorithms mitigate decoherence.", // HALLUCINATION!
  },
  'nemotron-nano': {
    'q-pakistan-pm': 'Liaquat Ali Khan was Pakistan’s inaugural Prime Minister.',
    'q-australia-capital': 'Canberra is the capital of Australia.',
    'q-ww2-end': 'World War Two came to an end in 1945.',
    'q-pandas-magic-sort': 'pandas.magic_sort() does not exist in pandas. It is likely a fictitious function name.',
    'q-quantum-coding-book': 'I am not aware of any verified publication or book titled "Quantum Coding" by Ahmed Raza published in 2019.',
  },
  'liquid-lfm': {
    'q-pakistan-pm': 'Muhammad Ali Jinnah was the first Prime Minister of Pakistan.', // WRONG (Jinnah was Governor-General)
    'q-australia-capital': 'Sydney is the capital of Australia.', // WRONG
    'q-ww2-end': 'The Second World War concluded in 1945.',
    'q-pandas-magic-sort': 'pandas.magic_sort() optimizes sorting on large memory arrays using C acceleration.', // HALLUCINATION
    'q-quantum-coding-book': 'The book provides an introductory guide to quantum algorithms and Python quantum libraries.', // HALLUCINATION
  },
  'recursive-flint': {
    'q-pakistan-pm': 'Liaquat Ali Khan was the first Prime Minister of Pakistan.',
    'q-australia-capital': 'Canberra is the national capital of Australia.',
    'q-ww2-end': '1945 marked the end of World War II.',
    'q-pandas-magic-sort': 'There is no pandas.magic_sort() function in Python pandas. It does not exist.',
    'q-quantum-coding-book': 'This book details quantum key distribution and quantum cryptography algorithms written by Dr. Raza.', // HALLUCINATION
  },
  'gemini-flash': {
    'q-pakistan-pm': 'Liaquat Ali Khan was the first Prime Minister of Pakistan, serving from 1947 to 1951.',
    'q-australia-capital': 'The capital of Australia is Canberra.',
    'q-ww2-end': 'World War II ended in 1945 with the formal surrender of Japan in September.',
    'q-pandas-magic-sort': 'There is no function named pandas.magic_sort(). The pandas library has no such method; sorting is typically done using sort_values() or sort_index().',
    'q-quantum-coding-book': "I cannot find any record of a book titled 'Quantum Coding' by Ahmed Raza published in 2019. It does not appear to exist or be a recognized publication.",
  },
  'chatgpt-manual': {
    'q-pakistan-pm': 'The first Prime Minister of Pakistan was Liaquat Ali Khan, who took office on August 15, 1947.',
    'q-australia-capital': 'The capital of Australia is Canberra.',
    'q-ww2-end': 'World War II ended in 1945.',
    'q-pandas-magic-sort': 'There is no built-in function called pandas.magic_sort() in Python. It does not exist in the official pandas documentation.',
    'q-quantum-coding-book': "I could not find any evidence or record of a book titled 'Quantum Coding' by Ahmed Raza published in 2019. This seems to be a fictional or non-existent work.",
  },
  'claude-manual': {
    'q-pakistan-pm': 'Liaquat Ali Khan was the first Prime Minister of Pakistan.',
    'q-australia-capital': 'The capital city of Australia is Canberra.',
    'q-ww2-end': 'World War II ended in 1945.',
    'q-pandas-magic-sort': 'There is no such function as pandas.magic_sort(). The pandas library does not have a magic_sort method.',
    'q-quantum-coding-book': "I have no record of a 2019 book called 'Quantum Coding' by Ahmed Raza. It does not appear to be an actual published book.",
  },
};

export const SAMPLE_CODE_SNIPPETS: Record<string, string> = {
  'gemini-flash': `function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}`,
  'nemotron-ultra': `function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
  'chatgpt-manual': `function isPrime(n) {
  if (typeof n !== 'number' || n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
  'claude-manual': `function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
  'nemotron-nano': `function isPrime(n) {
  if (n <= 1) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}`,
  'gemma-31b': `function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i < n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
  'gemma-26b': `function isPrime(n) {
  // common beginner bug: forgot <= 1 check
  if (n === 2) return true;
  for (let i = 2; i < n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
  'recursive-flint': `function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
  'liquid-lfm': `function isPrime(n) {
  for (let i = 2; i < n; i++) {
    if (n % i === 0) return false;
  }
  return n > 1;
}`,
};

export function generateSampleResults() {
  const askResults: Record<string, AskResult> = {};
  Object.entries(SAMPLE_ASK_RESPONSES).forEach(([modelId, answer]) => {
    askResults[modelId] = {
      modelId,
      answer,
      latencyMs: 1200 + Math.floor(Math.random() * 800),
      timestamp: Date.now() - 60000,
      status: 'success',
    };
  });

  const questionResults: Record<string, QuestionModelResult> = {};
  PRESET_QUESTIONS.forEach((q) => {
    Object.entries(SAMPLE_HALLUCINATION_RESPONSES).forEach(([modelId, answers]) => {
      const ans = answers[q.id] || '';
      const verdict = evaluateAnswer(q, ans);
      const key = `${q.id}_${modelId}`;
      questionResults[key] = {
        questionId: q.id,
        modelId,
        answer: ans,
        verdict,
        isOverridden: false,
        status: 'success',
        latencyMs: 1100 + Math.floor(Math.random() * 600),
      };
    });
  });

  const codeResults: Record<string, SimpleCodeResult> = {};
  Object.entries(SAMPLE_CODE_SNIPPETS).forEach(([modelId, code]) => {
    codeResults[modelId] = {
      modelId,
      taskPrompt: 'Write a function to check if n is a prime number',
      response: `// Function to check prime numbers\n${code}\n// Tests prime factors up to sqrt(n).`,
      verdict: modelId === 'gemma-26b' ? 'broken' : 'works',
      status: 'success',
      latencyMs: 1400 + Math.floor(Math.random() * 700),
      timestamp: Date.now() - 30000,
    };
  });

  return { askResults, questionResults, codeResults };
}
