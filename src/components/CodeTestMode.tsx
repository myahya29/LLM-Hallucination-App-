import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import { ModelDefinition, ModelExecutionState, SimpleCodeResult } from '../types/benchmark';
import { ApiKeys, executeSingleModelWithRetry, sleep } from '../utils/api';

interface CodeTestModeProps {
  models: ModelDefinition[];
  keys: ApiKeys;
  codeResults: Record<string, SimpleCodeResult>;
  onUpdateCodeResult: (modelId: string, result: SimpleCodeResult) => void;
  onSetVerdict: (modelId: string, verdict: 'works' | 'broken') => void;
  onClearCodeResults: () => void;
  executionStates: Record<string, ModelExecutionState>;
  setExecutionStates: React.Dispatch<React.SetStateAction<Record<string, ModelExecutionState>>>;
  isExecuting: boolean;
  setIsExecuting: (val: boolean) => void;
}

const SAMPLE_TASKS = [
  'Write a function to find the largest number in an array',
  'Write a function to return only the even numbers from an array',
  'Write a function to compute factorial of n using a loop',
  'Write a function to reverse a string without built-in reverse',
  'Write a function to check if a number is prime',
];

export const CodeTestMode: React.FC<CodeTestModeProps> = ({
  models,
  keys,
  codeResults,
  onUpdateCodeResult,
  onSetVerdict,
  onClearCodeResults,
  executionStates,
  setExecutionStates,
  isExecuting,
  setIsExecuting,
}) => {
  const [taskDescription, setTaskDescription] = useState<string>(
    'Write a function to find the largest number in an array'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentRunningIndex, setCurrentRunningIndex] = useState<number>(-1);
  const [manualDrafts, setManualDrafts] = useState<Record<string, string>>({});

  const enabledModels = models.filter((m) => m.enabled);
  const apiModels = enabledModels.filter((m) => m.provider !== 'manual');
  const manualModels = enabledModels.filter((m) => m.provider === 'manual');

  const handleAskAll = async () => {
    if (!taskDescription.trim()) return;
    if (isExecuting) return;

    const hasOpenRouter = apiModels.some((m) => m.provider === 'openrouter');
    if (hasOpenRouter && !keys.openRouterKey.trim()) {
      alert('Please enter your OpenRouter API key in the top bar to run OpenRouter models.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsExecuting(true);

    const modelPrompt = `${taskDescription.trim()}. Write the code only, with a very short one-line explanation.`;

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
          modelPrompt,
          keys,
          (status) => {
            setExecutionStates((prev) => ({
              ...prev,
              [model.id]: { status },
            }));
          },
          controller.signal
        );

        onUpdateCodeResult(model.id, {
          modelId: model.id,
          taskPrompt: taskDescription.trim(),
          response: res.text,
          verdict: codeResults[model.id]?.verdict,
          status: 'success',
          latencyMs: res.latencyMs,
          timestamp: Date.now(),
        });

        setExecutionStates((prev) => ({
          ...prev,
          [model.id]: { status: 'success', latencyMs: res.latencyMs },
        }));
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) break;
        const errMsg = err?.message || 'Execution failed';

        onUpdateCodeResult(model.id, {
          modelId: model.id,
          taskPrompt: taskDescription.trim(),
          response: '',
          status: 'error',
          errorMessage: errMsg,
          timestamp: Date.now(),
        });

        setExecutionStates((prev) => ({
          ...prev,
          [model.id]: { status: 'error', errorMessage: errMsg },
        }));
      }

      // 2-second rate limit delay between calls
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
    onUpdateCodeResult(modelId, {
      modelId,
      taskPrompt: taskDescription.trim(),
      response: text.trim(),
      verdict: codeResults[modelId]?.verdict,
      status: 'success',
      timestamp: Date.now(),
    });
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Task input card */}
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
            <Code2 className="w-4 h-4 text-[#19B6A6]" />
            Type any coding task
          </label>
          <div
            style={{ color: 'var(--text-secondary)' }}
            className="text-xs"
          >
            Sends prompt with instructions: "Write the code only, with a very short one-line explanation."
          </div>
        </div>

        <div className="relative mb-3">
          <textarea
            rows={3}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="e.g. Write a function to find the largest number in an array"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-card)',
              color: 'var(--text-primary)',
            }}
            className="w-full border focus:border-[#19B6A6] focus:outline-none rounded-lg p-3 text-sm leading-relaxed transition-colors font-mono"
          />
        </div>

        {/* Preset prompts */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            style={{ color: 'var(--text-secondary)' }}
            className="text-xs font-medium mr-1"
          >
            Samples:
          </span>
          {SAMPLE_TASKS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setTaskDescription(sample)}
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

        {/* Action buttons */}
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t"
        >
          <div className="flex items-center gap-3">
            {!isExecuting ? (
              <button
                type="button"
                onClick={handleAskAll}
                disabled={!taskDescription.trim() || enabledModels.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#19B6A6] hover:bg-[#169f91] text-slate-950 font-bold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Ask all models ({apiModels.length} API + {manualModels.length} Manual)
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

            {Object.keys(codeResults).length > 0 && !isExecuting && (
              <button
                type="button"
                onClick={onClearCodeResults}
                style={{ color: 'var(--text-secondary)' }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs hover:text-red-500 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Code
              </button>
            )}
          </div>

          {/* Sequential indicator */}
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

      {/* Model Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3
            style={{ color: 'var(--text-primary)' }}
            className="text-base font-bold"
          >
            Code Results ({Object.keys(codeResults).length} generated)
          </h3>
          <span
            style={{ color: 'var(--text-secondary)' }}
            className="text-xs"
          >
            Review the code and mark "Works" or "Does not work"
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enabledModels.map((model) => {
            const result = codeResults[model.id];
            const state = executionStates[model.id];
            const isManual = model.provider === 'manual';
            const isCalling = state?.status === 'calling';
            const isRetrying = state?.status === 'retrying';
            const verdict = result?.verdict;

            return (
              <div
                key={model.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: isCalling
                    ? '#19B6A6'
                    : isRetrying
                    ? '#F5A524'
                    : verdict === 'works'
                    ? '#19B6A6'
                    : verdict === 'broken'
                    ? 'rgba(239, 68, 68, 0.6)'
                    : result?.status === 'error'
                    ? 'rgba(239, 68, 68, 0.5)'
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

                    {result?.response && (
                      <button
                        type="button"
                        onClick={() => handleCopy(result.response, model.id)}
                        style={{ color: 'var(--text-secondary)' }}
                        className="hover:opacity-80 p-1 rounded transition-opacity"
                        title="Copy code"
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
                <div className="flex-1 min-h-[160px] flex flex-col justify-between max-w-full">
                  {/* Status: Loading */}
                  {isCalling && (
                    <div className="flex flex-col items-center justify-center py-10 text-[#19B6A6] space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-mono font-medium">Generating code...</span>
                    </div>
                  )}

                  {/* Status: Retrying */}
                  {isRetrying && (
                    <div className="flex flex-col items-center justify-center py-10 text-[#F5A524] space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-mono font-medium">Rate limit: retrying...</span>
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
                        className="font-mono text-[11px] break-words"
                      >
                        {result.errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Code Display */}
                  {!isCalling && !isRetrying && result?.response && (
                    <div className="space-y-3 max-w-full">
                      <div
                        style={{
                          backgroundColor: 'var(--bg-code)',
                          borderColor: 'var(--border-card)',
                        }}
                        className="border rounded-lg p-3 max-h-72 overflow-y-auto overflow-x-auto"
                      >
                        <pre
                          style={{
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                          }}
                          className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed"
                        >
                          <code>{result.response}</code>
                        </pre>
                      </div>

                      {/* Marks / Verdict buttons */}
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => onSetVerdict(model.id, 'works')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                              verdict === 'works'
                                ? 'bg-[#19B6A6] text-slate-950 border-[#19B6A6] shadow-sm font-bold'
                                : 'hover:bg-[#19B6A6]/10 text-[#19B6A6] border-[#19B6A6]/40'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Works
                          </button>

                          <button
                            type="button"
                            onClick={() => onSetVerdict(model.id, 'broken')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                              verdict === 'broken'
                                ? 'bg-red-600 text-white border-red-600 shadow-sm font-bold'
                                : 'hover:bg-red-500/10 text-red-500 border-red-500/40'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Does not work
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Paste for ChatGPT & Claude */}
                  {isManual && !result?.response && (
                    <div className="space-y-2.5 my-auto">
                      <div className="text-xs font-medium text-indigo-500 dark:text-indigo-300">
                        Paste {model.name} code manually:
                      </div>
                      <textarea
                        rows={5}
                        value={manualDrafts[model.id] ?? ''}
                        onChange={(e) =>
                          setManualDrafts({ ...manualDrafts, [model.id]: e.target.value })
                        }
                        placeholder={`Paste code copied from ${
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
                        Save Code
                      </button>
                    </div>
                  )}

                  {!isCalling && !isRetrying && !result && !isManual && (
                    <div
                      style={{ color: 'var(--text-muted)' }}
                      className="flex flex-col items-center justify-center py-10 text-xs"
                    >
                      <span>Waiting to generate code...</span>
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
