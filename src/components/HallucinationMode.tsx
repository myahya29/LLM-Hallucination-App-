import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MousePointerClick,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  XCircle,
} from 'lucide-react';
import {
  HallucinationVerdict,
  ModelDefinition,
  ModelExecutionState,
  QuestionModelResult,
  QuestionPreset,
} from '../types/benchmark';
import { ApiKeys, executeSingleModelWithRetry, sleep } from '../utils/api';
import { PRESET_QUESTIONS } from '../utils/constants';
import { evaluateAnswer, toggleVerdict } from '../utils/evaluator';

interface HallucinationModeProps {
  models: ModelDefinition[];
  keys: ApiKeys;
  questionResults: Record<string, QuestionModelResult>;
  onUpdateResult: (key: string, result: QuestionModelResult) => void;
  onClearResults: () => void;
  executionStates: Record<string, ModelExecutionState>;
  setExecutionStates: React.Dispatch<React.SetStateAction<Record<string, ModelExecutionState>>>;
  isExecuting: boolean;
  setIsExecuting: (val: boolean) => void;
}

export const HallucinationMode: React.FC<HallucinationModeProps> = ({
  models,
  keys,
  questionResults,
  onUpdateResult,
  onClearResults,
  executionStates,
  setExecutionStates,
  isExecuting,
  setIsExecuting,
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(PRESET_QUESTIONS[0].id);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [runningLabel, setRunningLabel] = useState<string>('');
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});

  const currentQuestion =
    PRESET_QUESTIONS.find((q) => q.id === selectedQuestionId) || PRESET_QUESTIONS[0];

  const enabledModels = models.filter((m) => m.enabled);
  const apiModels = enabledModels.filter((m) => m.provider !== 'manual');

  // Run a single question across enabled API models
  const handleRunQuestion = async (question: QuestionPreset) => {
    if (isExecuting) return;

    const hasOpenRouter = apiModels.some((m) => m.provider === 'openrouter');

    if (hasOpenRouter && !keys.openRouterKey.trim()) {
      alert('Please enter your OpenRouter API key in the top bar to run OpenRouter models.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsExecuting(true);

    for (let i = 0; i < apiModels.length; i++) {
      if (controller.signal.aborted) break;
      const model = apiModels[i];
      setRunningLabel(`Querying ${model.name} (${i + 1} of ${apiModels.length})...`);

      setExecutionStates((prev) => ({
        ...prev,
        [model.id]: { status: 'calling' },
      }));

      const resultKey = `${question.id}_${model.id}`;

      try {
        const res = await executeSingleModelWithRetry(
          model,
          question.prompt,
          keys,
          (status) => {
            setExecutionStates((prev) => ({
              ...prev,
              [model.id]: { status },
            }));
          },
          controller.signal
        );

        const verdict = evaluateAnswer(question, res.text);

        onUpdateResult(resultKey, {
          questionId: question.id,
          modelId: model.id,
          answer: res.text,
          verdict,
          isOverridden: false,
          status: 'success',
          latencyMs: res.latencyMs,
        });

        setExecutionStates((prev) => ({
          ...prev,
          [model.id]: { status: 'success', latencyMs: res.latencyMs },
        }));
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) break;
        const errMsg = err?.message || 'Error occurred';

        onUpdateResult(resultKey, {
          questionId: question.id,
          modelId: model.id,
          answer: '',
          verdict: question.type === 'real' ? 'wrong' : 'hallucinated',
          isOverridden: false,
          status: 'error',
          errorMessage: errMsg,
        });

        setExecutionStates((prev) => ({
          ...prev,
          [model.id]: { status: 'error', errorMessage: errMsg },
        }));
      }

      // 2s pause between calls
      if (i < apiModels.length - 1 && !controller.signal.aborted) {
        await sleep(2000);
      }
    }

    setIsExecuting(false);
    setRunningLabel('');
    setAbortController(null);
  };

  // Run all 5 questions sequentially
  const handleRunAllQuestions = async () => {
    if (isExecuting) return;

    const hasOpenRouter = apiModels.some((m) => m.provider === 'openrouter');

    if (hasOpenRouter && !keys.openRouterKey.trim()) {
      alert('Please enter your OpenRouter API key in the top bar to run OpenRouter models.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsExecuting(true);

    for (let qIdx = 0; qIdx < PRESET_QUESTIONS.length; qIdx++) {
      if (controller.signal.aborted) break;
      const question = PRESET_QUESTIONS[qIdx];
      setSelectedQuestionId(question.id);

      for (let mIdx = 0; mIdx < apiModels.length; mIdx++) {
        if (controller.signal.aborted) break;
        const model = apiModels[mIdx];
        setRunningLabel(`Q${qIdx + 1}/5: ${model.name} (${mIdx + 1}/${apiModels.length})...`);

        setExecutionStates((prev) => ({
          ...prev,
          [model.id]: { status: 'calling' },
        }));

        const resultKey = `${question.id}_${model.id}`;

        try {
          const res = await executeSingleModelWithRetry(
            model,
            question.prompt,
            keys,
            (status) => {
              setExecutionStates((prev) => ({
                ...prev,
                [model.id]: { status },
              }));
            },
            controller.signal
          );

          const verdict = evaluateAnswer(question, res.text);

          onUpdateResult(resultKey, {
            questionId: question.id,
            modelId: model.id,
            answer: res.text,
            verdict,
            isOverridden: false,
            status: 'success',
            latencyMs: res.latencyMs,
          });

          setExecutionStates((prev) => ({
            ...prev,
            [model.id]: { status: 'success', latencyMs: res.latencyMs },
          }));
        } catch (err: any) {
          if (err.name === 'AbortError' || controller.signal.aborted) break;
          const errMsg = err?.message || 'Error occurred';

          onUpdateResult(resultKey, {
            questionId: question.id,
            modelId: model.id,
            answer: '',
            verdict: question.type === 'real' ? 'wrong' : 'hallucinated',
            isOverridden: false,
            status: 'error',
            errorMessage: errMsg,
          });

          setExecutionStates((prev) => ({
            ...prev,
            [model.id]: { status: 'error', errorMessage: errMsg },
          }));
        }

        // 2-second rate limit pause
        if (!controller.signal.aborted) {
          await sleep(2000);
        }
      }
    }

    setIsExecuting(false);
    setRunningLabel('');
    setAbortController(null);
  };

  const handleStop = () => {
    if (abortController) abortController.abort();
    setIsExecuting(false);
    setRunningLabel('');
  };

  const handleToggleVerdict = (question: QuestionPreset, modelId: string) => {
    const key = `${question.id}_${modelId}`;
    const existing = questionResults[key];
    if (!existing) return;

    const newVerdict = toggleVerdict(existing.verdict, question.type);
    onUpdateResult(key, {
      ...existing,
      verdict: newVerdict,
      isOverridden: true,
    });
  };

  const handleSaveManual = (question: QuestionPreset, modelId: string) => {
    const inputKey = `${question.id}_${modelId}`;
    const text = manualInputs[inputKey] || '';
    if (!text.trim()) return;

    const verdict = evaluateAnswer(question, text.trim());
    onUpdateResult(inputKey, {
      questionId: question.id,
      modelId,
      answer: text.trim(),
      verdict,
      isOverridden: false,
      status: 'success',
    });
  };

  const currentResults = enabledModels
    .map((m) => questionResults[`${currentQuestion.id}_${m.id}`])
    .filter(Boolean);

  const correctCount = currentResults.filter((r) => r.verdict === 'correct').length;
  const honestCount = currentResults.filter((r) => r.verdict === 'honest').length;
  const hallucinatedCount = currentResults.filter((r) => r.verdict === 'hallucinated').length;
  const wrongCount = currentResults.filter((r) => r.verdict === 'wrong').length;

  return (
    <div className="space-y-6 max-w-full">
      {/* Question Selector Tabs */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
        className="border rounded-xl p-5 shadow-sm transition-colors"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h3
              style={{ color: 'var(--text-primary)' }}
              className="text-base font-bold flex items-center gap-2"
            >
              <AlertOctagon className="w-4 h-4 text-[#F5A524]" />
              Facts & Hallucination Test
            </h3>
            <p
              style={{ color: 'var(--text-secondary)' }}
              className="text-xs mt-0.5"
            >
              Comparing answers against verified facts vs. non-existent fictional entities
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isExecuting ? (
              <>
                <button
                  type="button"
                  onClick={() => handleRunQuestion(currentQuestion)}
                  disabled={apiModels.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#19B6A6] hover:bg-[#169f91] text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  Run Selected Question
                </button>
                <button
                  type="button"
                  onClick={handleRunAllQuestions}
                  disabled={apiModels.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F5A524] hover:bg-[#e09419] text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Run All 5 Sequentially
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* 5 Preset Question Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 mb-4">
          {PRESET_QUESTIONS.map((q, idx) => {
            const isSelected = q.id === selectedQuestionId;
            const isFake = q.type === 'fake';
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelectedQuestionId(q.id)}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-surface)' : 'var(--bg-card)',
                  borderColor: isSelected ? '#19B6A6' : 'var(--border-card)',
                }}
                className={`text-left p-2.5 rounded-lg border transition-all ${
                  isSelected ? 'ring-1 ring-[#19B6A6]' : 'hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    style={{ color: 'var(--text-secondary)' }}
                    className="text-[10px] font-mono font-bold"
                  >
                    Q{idx + 1}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isFake
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isFake ? 'Fake' : 'Real'}
                  </span>
                </div>
                <div
                  style={{ color: 'var(--text-primary)' }}
                  className="text-xs font-semibold line-clamp-2"
                >
                  {q.prompt}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Question Details Banner */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-card)',
          }}
          className="border rounded-lg p-3.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div
                style={{ color: 'var(--text-secondary)' }}
                className="text-xs font-mono mb-0.5"
              >
                Prompt:
              </div>
              <div
                style={{ color: 'var(--text-primary)' }}
                className="text-sm font-bold tracking-wide"
              >
                "{currentQuestion.prompt}"
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
                color: 'var(--text-primary)',
              }}
              className="text-xs border px-3 py-1.5 rounded-md shrink-0"
            >
              {currentQuestion.type === 'real' ? (
                <span>
                  Expected keyword:{' '}
                  <strong className="text-[#19B6A6]">{currentQuestion.expectedKeyword}</strong>
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Expected: State it does not exist / cannot verify
                </span>
              )}
            </div>
          </div>
          <p
            style={{ color: 'var(--text-secondary)' }}
            className="text-[11px] mt-2 font-mono"
          >
            {currentQuestion.explanation}
          </p>
        </div>

        {/* Live Running Indicator */}
        {isExecuting && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#19B6A6] bg-[#19B6A6]/10 border border-[#19B6A6]/30 px-3 py-2 rounded-lg animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{runningLabel} (2s delay between calls)</span>
          </div>
        )}

        {/* Stats summary for current question */}
        {currentResults.length > 0 && (
          <div
            style={{ borderColor: 'var(--border-subtle)' }}
            className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-4">
              {currentQuestion.type === 'real' ? (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Correct: <strong>{correctCount}</strong>
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    Wrong: <strong>{wrongCount}</strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Honest: <strong>{honestCount}</strong>
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10">
                    HALLUCINATED: {hallucinatedCount}
                  </span>
                </>
              )}
            </div>
            <span
              style={{ color: 'var(--text-muted)' }}
              className="text-[11px]"
            >
              * Click any verdict button below to toggle or adjust
            </span>
          </div>
        )}
      </div>

      {/* Model Cards Grid for current question */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {enabledModels.map((model) => {
          const resultKey = `${currentQuestion.id}_${model.id}`;
          const result = questionResults[resultKey];
          const state = executionStates[model.id];
          const isCalling = state?.status === 'calling';
          const isRetrying = state?.status === 'retrying';
          const isManual = model.provider === 'manual';

          const verdict = result?.verdict;
          const isHonestOrCorrect = verdict === 'correct' || verdict === 'honest';
          const isHallucinated = verdict === 'hallucinated';

          return (
            <div
              key={model.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: isCalling
                  ? '#19B6A6'
                  : isRetrying
                  ? '#F5A524'
                  : isHallucinated
                  ? 'rgba(239, 68, 68, 0.7)'
                  : isHonestOrCorrect
                  ? 'rgba(16, 185, 129, 0.5)'
                  : 'var(--border-card)',
              }}
              className={`flex flex-col border rounded-xl p-4 transition-all shadow-sm max-w-full overflow-hidden ${
                isCalling ? 'ring-2 ring-[#19B6A6]' : isRetrying ? 'ring-2 ring-[#F5A524]' : ''
              }`}
            >
              {/* Card Header with Model & Interactive Verdict */}
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

                {/* Verdict Pill Badge with Click to Override */}
                {result?.status === 'success' && verdict && (
                  <button
                    type="button"
                    onClick={() => handleToggleVerdict(currentQuestion, model.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
                      verdict === 'correct'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : verdict === 'honest'
                        ? 'bg-[#19B6A6]/20 text-[#0c7c71] dark:text-[#19B6A6] border border-[#19B6A6]/40 hover:bg-[#19B6A6]/30'
                        : verdict === 'hallucinated'
                        ? 'bg-red-600 text-white font-extrabold border border-red-500 hover:bg-red-500'
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                    title="Click to toggle this verdict"
                  >
                    {verdict === 'correct' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {verdict === 'honest' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {verdict === 'wrong' && <XCircle className="w-3.5 h-3.5" />}
                    {verdict === 'hallucinated' && <AlertTriangle className="w-3.5 h-3.5" />}

                    <span className="uppercase tracking-wider">
                      {verdict === 'hallucinated' ? 'HALLUCINATED' : verdict}
                    </span>
                    <MousePointerClick className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>
                )}
              </div>

              {/* Card Content */}
              <div className="flex-1 min-h-[140px] flex flex-col justify-between max-w-full">
                {isCalling && (
                  <div className="flex flex-col items-center justify-center py-8 text-[#19B6A6] space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-mono font-medium">Verifying fact...</span>
                  </div>
                )}

                {isRetrying && (
                  <div className="flex flex-col items-center justify-center py-8 text-[#F5A524] space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-mono font-medium">Auto-retrying model...</span>
                  </div>
                )}

                {!isCalling && !isRetrying && result?.status === 'error' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400 space-y-1">
                    <div className="font-bold">Execution Failed</div>
                    <p
                      style={{ overflowWrap: 'anywhere' }}
                      className="font-mono text-[11px] break-words"
                    >
                      {result.errorMessage}
                    </p>
                  </div>
                )}

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
                    {result.isOverridden && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-300 font-mono italic">
                        ✎ Adjusted manually
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Model Input (ChatGPT / Claude) */}
                {isManual && !result?.answer && (
                  <div className="space-y-2.5 my-auto">
                    <div className="text-xs text-indigo-500 dark:text-indigo-300 font-medium">
                      Paste response from {model.name}:
                    </div>
                    <textarea
                      rows={4}
                      value={manualInputs[`${currentQuestion.id}_${model.id}`] || ''}
                      onChange={(e) =>
                        setManualInputs({
                          ...manualInputs,
                          [`${currentQuestion.id}_${model.id}`]: e.target.value,
                        })
                      }
                      placeholder={`Paste answer from ${
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
                      onClick={() => handleSaveManual(currentQuestion, model.id)}
                      disabled={
                        !(manualInputs[`${currentQuestion.id}_${model.id}`] || '').trim()
                      }
                      className="w-full py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-40"
                    >
                      Save & Check
                    </button>
                  </div>
                )}

                {!isCalling && !isRetrying && !result && !isManual && (
                  <div
                    style={{ color: 'var(--text-muted)' }}
                    className="flex flex-col items-center justify-center py-8 text-xs"
                  >
                    <span>Not evaluated yet</span>
                  </div>
                )}
              </div>

              {/* Latency Footer */}
              {result?.latencyMs && (
                <div
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                  className="pt-2 mt-2 border-t flex items-center justify-between text-[10px] font-mono"
                >
                  <span>Latency: {(result.latencyMs / 1000).toFixed(2)}s</span>
                  <span>Click badge to toggle</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
