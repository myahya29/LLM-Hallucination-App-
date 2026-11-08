import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Sparkles,
} from 'lucide-react';
import { AskResult, ModelDefinition, ModelExecutionState } from '../types/benchmark';
import { ApiKeys, executeSingleModelWithRetry, sleep } from '../utils/api';

interface AskModeProps {
  models: ModelDefinition[];
  keys: ApiKeys;
  askResults: Record<string, AskResult>;
  onUpdateResult: (modelId: string, result: AskResult) => void;
  onClearResults: () => void;
  executionStates: Record<string, ModelExecutionState>;
  setExecutionStates: React.Dispatch<React.SetStateAction<Record<string, ModelExecutionState>>>;
  isExecuting: boolean;
  setIsExecuting: (val: boolean) => void;
}

const SAMPLE_PROMPTS = [
  'Explain how quantum computers differ from classical computers in 2 sentences.',
  'What is the difference between supervised, unsupervised, and reinforcement learning?',
  'Explain why the sky appears blue in simple terms.',
  'What are the three laws of robotics according to Isaac Asimov?',
];

export const AskMode: React.FC<AskModeProps> = ({
  models,
  keys,
  askResults,
  onUpdateResult,
  onClearResults,
  executionStates,
  setExecutionStates,
  isExecuting,
  setIsExecuting,
}) => {
  const [prompt, setPrompt] = useState(
    'Explain how quantum computers differ from classical computers in 2 sentences.'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentRunningIndex, setCurrentRunningIndex] = useState<number>(-1);
  const [manualDrafts, setManualDrafts] = useState<Record<string, string>>({});

  const enabledModels = models.filter((m) => m.enabled);
  const apiModels = enabledModels.filter((m) => m.provider !== 'manual');
  const manualModels = enabledModels.filter((m) => m.provider === 'manual');

  const handleAskAll = async () => {
    if (!prompt.trim()) return;
    if (isExecuting) return;

    // Check keys if any API models are enabled
    const hasOpenRouter = apiModels.some((m) => m.provider === 'openrouter');

    if (hasOpenRouter && !keys.openRouterKey.trim()) {
      alert('Please enter your OpenRouter API key in the top bar to run OpenRouter models.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsExecuting(true);

    // Run sequentially
    for (let i = 0; i < apiModels.length; i++) {
      if (controller.signal.aborted) break;
      const model = apiModels[i];
      setCurrentRunningIndex(i + 1);

      setExecutionStates((prev) => ({
        ...prev,
        [model.id]: { status: 'calling' },
      }));

      try {
        const res = await executeSingleModelWithRetry(
          model,
          prompt,
          keys,
          (status) => {
            setExecutionStates((prev) => ({
              ...prev,
              [model.id]: { status },
            }));
          },
          controller.signal
        );

        onUpdateResult(model.id, {
          modelId: model.id,
          answer: res.text,
          latencyMs: res.latencyMs,
          timestamp: Date.now(),
          status: 'success',
        });

        setExecutionStates((prev) => ({
          ...prev,
          [model.id]: { status: 'success', latencyMs: res.latencyMs },
        }));
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          break;
        }
        const errMsg = err?.message || 'Execution error';
        onUpdateResult(model.id, {
          modelId: model.id,
          answer: '',
          timestamp: Date.now(),
          status: 'error',
          errorMessage: errMsg,
        });

        setExecutionStates((prev) => ({
          ...prev,
          [model.id]: { status: 'error', errorMessage: errMsg },
        }));
      }

      // 2-second rate-limit protection delay between consecutive calls
      if (i < apiModels.length - 1 && !controller.signal.aborted) {
        await sleep(2000);
      }
    }

    setIsExecuting(false);
    setCurrentRunningIndex(-1);
    setAbortController(null);
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsExecuting(false);
    setCurrentRunningIndex(-1);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveManual = (modelId: string) => {
    const text = manualDrafts[modelId] || '';
    if (!text.trim()) return;
    onUpdateResult(modelId, {
      modelId,
      answer: text.trim(),
      timestamp: Date.now(),
      status: 'success',
    });
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Prompt input card */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
        className="border rounded-xl p-5 shadow-sm transition-colors"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <label
            style={{ color: 'var(--text-primary)' }}
            className="text-sm font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#19B6A6]" />
            Ask Mode
          </label>
          <div
            style={{ color: 'var(--text-secondary)' }}
            className="text-xs"
          >
            Runs sequentially (1 model at a time · 2s delay · 1 auto-retry)
          </div>
        </div>

        <div className="relative mb-3">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type any question to ask all models..."
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-card)',
              color: 'var(--text-primary)',
            }}
            className="w-full border focus:border-[#19B6A6] focus:outline-none rounded-lg p-3 text-sm leading-relaxed transition-colors"
          />
        </div>

        {/* Preset prompts */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            style={{ color: 'var(--text-secondary)' }}
            className="text-xs font-medium mr-1"
          >
            Presets:
          </span>
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(sample)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-card)',
                color: 'var(--text-primary)',
              }}
              className="text-xs px-2.5 py-1 rounded border hover:border-[#19B6A6] transition-colors truncate max-w-[280px]"
              title={sample}
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Action buttons & execution banner */}
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t"
        >
          <div className="flex items-center gap-3">
            {!isExecuting ? (
              <button
                type="button"
                onClick={handleAskAll}
                disabled={!prompt.trim() || enabledModels.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#19B6A6] hover:bg-[#169f91] text-slate-950 font-bold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Ask All ({apiModels.length} API + {manualModels.length} Manual)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-sm transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                Stop
              </button>
            )}

            {Object.keys(askResults).length > 0 && !isExecuting && (
              <button
                type="button"
                onClick={onClearResults}
                style={{ color: 'var(--text-secondary)' }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs hover:text-red-500 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Answers
              </button>
            )}
          </div>

          {/* Sequential queue indicator */}
          {isExecuting && (
            <div className="flex items-center gap-2.5 text-xs text-[#19B6A6] bg-[#19B6A6]/10 border border-[#19B6A6]/30 px-3.5 py-1.5 rounded-lg animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-[#19B6A6]" />
              <span>
                Running model {currentRunningIndex} of {apiModels.length} (2s pause between calls)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Answers Grid / Side by side */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3
            style={{ color: 'var(--text-primary)' }}
            className="text-base font-bold"
          >
            Responses ({Object.keys(askResults).length} received)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enabledModels.map((model) => {
            const result = askResults[model.id];
            const state = executionStates[model.id];
            const isManual = model.provider === 'manual';
            const isCalling = state?.status === 'calling';
            const isRetrying = state?.status === 'retrying';

            return (
              <div
                key={model.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: isCalling
                    ? '#19B6A6'
                    : isRetrying
                    ? '#F5A524'
                    : result?.status === 'error'
                    ? 'rgba(239, 68, 68, 0.6)'
                    : 'var(--border-card)',
                }}
                className={`flex flex-col border rounded-xl p-4 transition-all max-w-full overflow-hidden shadow-sm ${
                  isCalling ? 'ring-2 ring-[#19B6A6]' : isRetrying ? 'ring-2 ring-[#F5A524]' : ''
                }`}
              >
                {/* Card Header */}
                <div
                  style={{ borderColor: 'var(--border-subtle)' }}
                  className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b"
                >
                  <div className="min-w-0">
                    <h4
                      style={{ color: 'var(--text-primary)' }}
                      className="text-sm font-bold truncate"
                    >
                      {model.name}
                    </h4>
                    <span
                      style={{ color: 'var(--text-secondary)' }}
                      className="text-[11px] font-mono truncate block"
                    >
                      {model.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {result?.latencyMs && (
                      <span
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                        }}
                        className="text-[11px] font-mono flex items-center gap-1 px-2 py-0.5 rounded"
                      >
                        <Clock className="w-3 h-3 text-[#19B6A6]" />
                        {(result.latencyMs / 1000).toFixed(1)}s
                      </span>
                    )}

                    {result?.answer && (
                      <button
                        type="button"
                        onClick={() => handleCopy(result.answer, model.id)}
                        style={{ color: 'var(--text-secondary)' }}
                        className="hover:opacity-80 p-1 rounded transition-opacity"
                        title="Copy answer"
                      >
                        {copiedId === model.id ? (
                          <Check className="w-3.5 h-3.5 text-[#19B6A6]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 min-h-[140px] flex flex-col justify-between max-w-full">
                  {/* Status: Loading */}
                  {isCalling && (
                    <div className="flex flex-col items-center justify-center py-8 text-[#19B6A6] space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-mono font-medium">Generating response...</span>
                    </div>
                  )}

                  {/* Status: Retrying */}
                  {isRetrying && (
                    <div className="flex flex-col items-center justify-center py-8 text-[#F5A524] space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-mono font-medium">Rate limit: auto-retrying...</span>
                    </div>
                  )}

                  {/* Status: Error */}
                  {!isCalling && !isRetrying && result?.status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Execution Failed
                      </div>
                      <p
                        style={{ overflowWrap: 'anywhere' }}
                        className="font-mono text-[11px] leading-relaxed break-words"
                      >
                        {result.errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Status: Success / Answer Display */}
                  {!isCalling && !isRetrying && result?.answer && (
                    <div className="space-y-2 max-w-full">
                      <p
                        style={{
                          color: 'var(--text-primary)',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                        }}
                        className="text-xs leading-relaxed whitespace-pre-wrap max-w-full"
                      >
                        {result.answer}
                      </p>
                      <div
                        style={{
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-muted)',
                        }}
                        className="text-[10px] font-mono pt-2 border-t flex items-center justify-between"
                      >
                        <span>{result.answer.split(/\s+/).filter(Boolean).length} words</span>
                        <span>{result.answer.length} characters</span>
                      </div>
                    </div>
                  )}

                  {/* Manual Paste Box for ChatGPT & Claude */}
                  {isManual && !result?.answer && (
                    <div className="space-y-2.5 my-auto">
                      <div className="text-xs font-medium text-indigo-500 dark:text-indigo-300">
                        Paste {model.name} response manually:
                      </div>
                      <textarea
                        rows={4}
                        value={manualDrafts[model.id] ?? ''}
                        onChange={(e) =>
                          setManualDrafts({ ...manualDrafts, [model.id]: e.target.value })
                        }
                        placeholder={`Paste answer copied from ${
                          model.id === 'chatgpt-manual' ? 'chatgpt.com' : 'claude.ai'
                        }...`}
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-card)',
                          color: 'var(--text-primary)',
                        }}
                        className="w-full border rounded p-2 text-xs focus:outline-none focus:border-indigo-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveManual(model.id)}
                        disabled={!(manualDrafts[model.id] || '').trim()}
                        className="w-full py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-40"
                      >
                        Save Manual Answer
                      </button>
                    </div>
                  )}

                  {/* Empty state if idle */}
                  {!isCalling && !isRetrying && !result && !isManual && (
                    <div
                      style={{ color: 'var(--text-muted)' }}
                      className="flex flex-col items-center justify-center py-8 text-xs"
                    >
                      <span>Waiting to execute...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
