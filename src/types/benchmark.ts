export interface ModelDefinition {
  id: string;
  name: string;
  provider: 'openrouter' | 'gemini' | 'manual';
  modelKey: string;
  badge: string;
  description: string;
  enabled: boolean;
}

export interface ModelExecutionState {
  status: 'idle' | 'calling' | 'retrying' | 'success' | 'error';
  latencyMs?: number;
  errorMessage?: string;
}

export interface AskResult {
  modelId: string;
  answer: string;
  latencyMs?: number;
  timestamp: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface QuestionPreset {
  id: string;
  type: 'real' | 'fake';
  prompt: string;
  expectedKeyword?: string;
  explanation: string;
}

export type HallucinationVerdict = 'correct' | 'wrong' | 'honest' | 'hallucinated';

export interface QuestionModelResult {
  questionId: string;
  modelId: string;
  answer: string;
  verdict: HallucinationVerdict;
  isOverridden: boolean;
  status: 'idle' | 'calling' | 'retrying' | 'success' | 'error';
  errorMessage?: string;
  latencyMs?: number;
}

export interface SimpleCodeResult {
  modelId: string;
  taskPrompt: string;
  response: string;
  verdict?: 'works' | 'broken';
  status: 'idle' | 'calling' | 'retrying' | 'success' | 'error';
  errorMessage?: string;
  latencyMs?: number;
  timestamp: number;
}

export interface ScoreboardRow {
  modelId: string;
  modelName: string;
  provider: string;
  codeWorksCount: number;
  factsCorrect: number;
  hallucinations: number;
  totalScore: number;
  isWinner?: boolean;
}
