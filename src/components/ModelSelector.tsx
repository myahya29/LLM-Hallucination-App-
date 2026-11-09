import React from 'react';
import { CheckSquare, Square, Layers, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { ModelDefinition, ModelExecutionState } from '../types/benchmark';

interface ModelSelectorProps {
  models: ModelDefinition[];
  onToggleModel: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  executionStates?: Record<string, ModelExecutionState>;
  isExecuting?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  onToggleModel,
  onSelectAll,
  executionStates = {},
  isExecuting = false,
}) => {
  const enabledCount = models.filter((m) => m.enabled).length;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
      }}
      className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs transition-colors max-w-full"
    >
      <div
        style={{ borderColor: 'var(--border-subtle)' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#19B6A6]/10 text-[#19B6A6] border border-[#19B6A6]/20 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                style={{ color: 'var(--text-primary)' }}
                className="text-sm font-bold tracking-tight"
              >
                Target Models
              </span>
              <span
                style={{ color: 'var(--text-secondary)' }}
                className="text-xs font-mono font-medium"
              >
                ({enabledCount} of {models.length} active)
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Choose which models to compare across tests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isExecuting}
            onClick={() => onSelectAll(true)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-card)',
              color: 'var(--text-primary)',
            }}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold border rounded-xl hover:border-[#19B6A6] hover:text-[#19B6A6] transition-all duration-180 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center active:scale-95 shadow-xs"
          >
            Select All
          </button>
          <button
            type="button"
            disabled={isExecuting}
            onClick={() => onSelectAll(false)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-card)',
              color: 'var(--text-secondary)',
            }}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold border rounded-xl hover:border-red-400 hover:text-red-500 transition-all duration-180 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center active:scale-95 shadow-xs"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Grid: 1 col on phone, 2 on tablet, 3 on laptop (1280px+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {models.map((model) => {
          const state = executionStates[model.id];
          const isCalling = state?.status === 'calling';
          const isRetrying = state?.status === 'retrying';
          const isError = state?.status === 'error';
          const isSuccess = state?.status === 'success';

          return (
            <div
              key={model.id}
              onClick={() => !isExecuting && onToggleModel(model.id)}
              style={{
                backgroundColor: model.enabled ? 'var(--bg-surface)' : 'var(--bg-app)',
                borderColor: model.enabled ? 'var(--border-card)' : 'transparent',
                opacity: model.enabled ? 1 : 0.6,
              }}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-180 cursor-pointer min-h-[56px] select-none ${
                isCalling
                  ? 'ring-2 ring-[#19B6A6] bg-[#19B6A6]/5'
                  : isRetrying
                  ? 'ring-2 ring-[#F5A524] bg-[#F5A524]/5'
                  : 'hover:border-[#19B6A6]/40'
              } ${isExecuting ? 'cursor-not-allowed' : 'active:scale-[0.99]'}`}
            >
              <div className="pt-0.5 shrink-0 text-[#19B6A6]">
                {model.enabled ? (
                  <CheckSquare className="w-4 h-4 fill-[#19B6A6]/20 text-[#19B6A6]" />
                ) : (
                  <Square
                    style={{ color: 'var(--text-muted)' }}
                    className="w-4 h-4"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span
                    style={{ color: 'var(--text-primary)' }}
                    className="text-xs sm:text-sm font-semibold truncate"
                  >
                    {model.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 font-bold border ${
                      model.provider === 'gemini'
                        ? 'text-[#F5A524] bg-[#F5A524]/15 border-[#F5A524]/30'
                        : model.provider === 'manual'
                        ? 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30'
                        : 'text-[#19B6A6] bg-[#19B6A6]/15 border-[#19B6A6]/30'
                    }`}
                  >
                    {model.provider === 'openrouter'
                      ? 'OpenRouter'
                      : model.provider === 'gemini'
                      ? 'Gemini'
                      : 'Manual'}
                  </span>
                </div>

                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-[11px] truncate font-mono"
                >
                  {model.badge}
                </div>

                {/* Status indicator during execution */}
                {state && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold flex-wrap">
                    {isCalling && (
                      <span className="text-[#19B6A6] flex items-center gap-1.5 bg-[#19B6A6]/10 px-2 py-0.5 rounded-md border border-[#19B6A6]/30 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-[#19B6A6]" />
                        Generating...
                      </span>
                    )}
                    {isRetrying && (
                      <span className="text-[#F5A524] flex items-center gap-1.5 bg-[#F5A524]/10 px-2 py-0.5 rounded-md border border-[#F5A524]/30">
                        <span className="w-2 h-2 rounded-full bg-[#F5A524] animate-bounce" />
                        Auto-retrying...
                      </span>
                    )}
                    {isSuccess && (
                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Done {state.latencyMs ? `(${(state.latencyMs / 1000).toFixed(1)}s)` : ''}
                      </span>
                    )}
                    {isError && (
                      <span
                        className="text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 truncate max-w-full"
                        title={state.errorMessage}
                      >
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {state.errorMessage?.includes('429') ? 'Rate Limited' : 'Failed'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
