import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { ApiKeys } from '../utils/api';

interface KeyBarProps {
  keys: ApiKeys;
  onKeysChange: (keys: ApiKeys) => void;
  onLoadDemoData: () => void;
  hasBenchmarkData: boolean;
  onClearData: () => void;
}

export const KeyBar: React.FC<KeyBarProps> = ({
  keys,
  onKeysChange,
  onLoadDemoData,
  hasBenchmarkData,
  onClearData,
}) => {
  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
      }}
      className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs transition-colors max-w-full"
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Keys Input Section */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* OpenRouter Key */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <label
                style={{ color: 'var(--text-primary)' }}
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#19B6A6] shrink-0" />
                <span>OpenRouter API key</span>
              </label>
              <div>
                {keys.openRouterKey.trim() ? (
                  <span className="text-[11px] text-[#19B6A6] flex items-center gap-1 font-medium bg-[#19B6A6]/10 px-2 py-0.5 rounded-md border border-[#19B6A6]/20">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-500 dark:text-amber-400 flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <ShieldAlert className="w-3 h-3 shrink-0" /> Required for 6 free models
                  </span>
                )}
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                type={showOpenRouter ? 'text' : 'password'}
                value={keys.openRouterKey}
                onChange={(e) =>
                  onKeysChange({ ...keys, openRouterKey: e.target.value })
                }
                placeholder="sk-or-v1-..."
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-card)',
                  color: 'var(--text-primary)',
                }}
                className="w-full min-h-[44px] border focus:border-[#19B6A6] focus:ring-2 focus:ring-[#19B6A6]/20 focus:outline-none rounded-xl px-3.5 py-2.5 pr-12 text-xs font-mono transition-all duration-180"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowOpenRouter(!showOpenRouter)}
                style={{ color: 'var(--text-secondary)' }}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-[var(--text-primary)] transition-colors cursor-pointer rounded-lg"
                title={showOpenRouter ? 'Hide key' : 'Show key'}
                aria-label={showOpenRouter ? 'Hide OpenRouter API key' : 'Show OpenRouter API key'}
              >
                {showOpenRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Gemini Key */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <label
                style={{ color: 'var(--text-primary)' }}
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#F5A524] shrink-0" />
                <span>Gemini API key</span>
              </label>
              <div>
                {keys.geminiKey.trim() ? (
                  <span className="text-[11px] text-[#19B6A6] flex items-center gap-1 font-medium bg-[#19B6A6]/10 px-2 py-0.5 rounded-md border border-[#19B6A6]/20">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Custom Key Active
                  </span>
                ) : (
                  <span className="text-[11px] text-[#19B6A6] flex items-center gap-1 font-medium px-2 py-0.5 rounded-md border border-[#19B6A6]/30 bg-[#19B6A6]/10">
                    <CheckCircle2 className="w-3 h-3 text-[#19B6A6] shrink-0" /> Server Key Active
                  </span>
                )}
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                type={showGemini ? 'text' : 'password'}
                value={keys.geminiKey}
                onChange={(e) =>
                  onKeysChange({ ...keys, geminiKey: e.target.value })
                }
                placeholder="Optional (server key active automatically)..."
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-card)',
                  color: 'var(--text-primary)',
                }}
                className="w-full min-h-[44px] border focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20 focus:outline-none rounded-xl px-3.5 py-2.5 pr-12 text-xs font-mono transition-all duration-180"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                style={{ color: 'var(--text-secondary)' }}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-[var(--text-primary)] transition-colors cursor-pointer rounded-lg"
                title={showGemini ? 'Hide key' : 'Show key'}
                aria-label={showGemini ? 'Hide Gemini API key' : 'Show Gemini API key'}
              >
                {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions for testing / sample data */}
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0"
        >
          <button
            type="button"
            onClick={onLoadDemoData}
            className="min-h-[44px] px-4 py-2.5 text-xs font-bold text-slate-950 bg-[#19B6A6] hover:bg-[#169f91] active:scale-[0.98] rounded-xl shadow-xs transition-all duration-180 flex items-center justify-center gap-2 cursor-pointer"
            title="Load sample test responses"
          >
            <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Load Sample Data</span>
          </button>

          {hasBenchmarkData && (
            <button
              type="button"
              onClick={onClearData}
              style={{ color: 'var(--text-secondary)' }}
              className="min-h-[44px] px-3.5 py-2 text-xs hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-180 border border-transparent hover:border-red-400/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Stored Data</span>
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
        className="mt-3 pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] gap-2 leading-relaxed"
      >
        <span>
          Keys stay in memory only for the session and are never saved or sent elsewhere.
        </span>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[32px] inline-flex items-center text-[#19B6A6] font-medium hover:underline"
          >
            Get OpenRouter Key ↗
          </a>
          <span style={{ color: 'var(--border-card)' }}>·</span>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[32px] inline-flex items-center text-[#F5A524] font-medium hover:underline"
          >
            Get Gemini Key ↗
          </a>
        </div>
      </div>
    </div>
  );
};
