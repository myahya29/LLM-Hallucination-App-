import React from 'react';
import { CheckSquare, Square, Layers } from 'lucide-react';
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
      className="border rounded-xl p-4 mb-6 shadow-sm transition-colors"
    >
      <div
        style={{ borderColor: 'var(--border-subtle)' }}
        className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#19B6A6]" />
          <span
            style={{ color: 'var(--text-primary)' }}
            className="text-sm font-bold"
          >
            Models
          </span>
          <span
            style={{ color: 'var(--text-secondary)' }}
            className="text-xs font-mono"
          >
            ({enabledCount} of {models.length} active)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isExecuting}
            onClick={() => onSelectAll(true)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-card)',
              color: 'var(--text-primary)',
            }}
            className="text-xs px-2.5 py-1 border rounded hover:opacity-85 transition-opacity disabled:opacity-50"
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
            className="text-xs px-2.5 py-1 border rounded hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                isCalling ? 'ring-2 ring-[#19B6A6] animate-pulse' : ''
              } ${isRetrying ? 'ring-2 ring-[#F5A524]' : ''} ${
                isExecuting ? 'cursor-not-allowed' : ''
              }`}
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
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    style={{ color: 'var(--text-primary)' }}
                    className="text-xs font-semibold truncate"
                  >
                    {model.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 font-medium ${
                      model.provider === 'gemini'
                        ? 'text-[#F5A524] bg-[#F5A524]/15'
                        : model.provider === 'manual'
                        ? 'text-indigo-500 bg-indigo-500/15'
                        : 'text-[#19B6A6] bg-[#19B6A6]/15'
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
                  {model.modelKey}
                </div>

                {/* Status indicator during execution */}
                {state && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium">
                    {isCalling && (
                      <span className="text-[#19B6A6] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#19B6A6] animate-ping" />
                        Generating...
                      </span>
                    )}
                    {isRetrying && (
                      <span className="text-[#F5A524] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#F5A524] animate-bounce" />
                        Auto-retrying...
                      </span>
                    )}
                    {isSuccess && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Done {state.latencyMs ? `(${Math.round(state.latencyMs / 100) / 10}s)` : ''}
                      </span>
                    )}
                    {isError && (
                      <span className="text-red-500 truncate" title={state.errorMessage}>
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
