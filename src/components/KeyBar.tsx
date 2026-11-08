import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert, Sparkles } from 'lucide-react';
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
      className="border rounded-xl p-4 mb-6 shadow-sm transition-colors"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Keys Input Section */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* OpenRouter Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                style={{ color: 'var(--text-primary)' }}
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#19B6A6]" />
                OpenRouter API key
              </label>
              <div className="flex items-center gap-2">
                {keys.openRouterKey.trim() ? (
                  <span className="text-[11px] text-[#19B6A6] flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-500 flex items-center gap-1 font-medium">
                    <ShieldAlert className="w-3 h-3" /> Required for 6 free models
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
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
                className="w-full border focus:border-[#19B6A6] focus:outline-none rounded-lg px-3 py-2 pr-10 text-xs font-mono transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowOpenRouter(!showOpenRouter)}
                style={{ color: 'var(--text-secondary)' }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity p-1"
                title={showOpenRouter ? 'Hide key' : 'Show key'}
              >
                {showOpenRouter ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Gemini Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                style={{ color: 'var(--text-primary)' }}
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#F5A524]" />
                Gemini API key
              </label>
              <div className="flex items-center gap-2">
                {keys.geminiKey.trim() ? (
                  <span className="text-[11px] text-[#19B6A6] flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Custom Key Active
                  </span>
                ) : (
                  <span className="text-[11px] text-[#19B6A6] flex items-center gap-1 font-medium px-2 py-0.5 rounded border border-[#19B6A6]/30 bg-[#19B6A6]/10">
                    <CheckCircle2 className="w-3 h-3 text-[#19B6A6]" /> Server Key Active
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
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
                className="w-full border focus:border-[#F5A524] focus:outline-none rounded-lg px-3 py-2 pr-10 text-xs font-mono transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                style={{ color: 'var(--text-secondary)' }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity p-1"
                title={showGemini ? 'Hide key' : 'Show key'}
              >
                {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions for testing / sample data */}
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="flex sm:flex-col items-center sm:items-stretch gap-2 shrink-0 w-full sm:w-auto pt-2 lg:pt-0 border-t sm:border-t-0"
        >
          <button
            type="button"
            onClick={onLoadDemoData}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-gradient-to-r from-[#19B6A6] to-[#25D4C0] hover:brightness-105 rounded-lg shadow-sm transition-all"
            title="Load sample test responses"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            Load Sample Data
          </button>

          {hasBenchmarkData && (
            <button
              type="button"
              onClick={onClearData}
              style={{ color: 'var(--text-secondary)' }}
              className="px-3 py-1.5 text-xs hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-400/40 text-center"
            >
              Clear Stored Data
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
        className="mt-2.5 pt-2 border-t flex flex-wrap items-center justify-between text-[11px] gap-2"
      >
        <span>
          Keys stay in memory only for the session and are never saved or sent elsewhere.
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#19B6A6] font-medium hover:underline"
          >
            Get OpenRouter Key ↗
          </a>
          <span style={{ color: 'var(--border-card)' }}>·</span>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F5A524] font-medium hover:underline"
          >
            Get Gemini Key ↗
          </a>
        </div>
      </div>
    </div>
  );
};
