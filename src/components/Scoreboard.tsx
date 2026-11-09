import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Info,
  Medal,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import {
  ModelDefinition,
  QuestionModelResult,
  ScoreboardRow,
  SimpleCodeResult,
} from '../types/benchmark';
import { PRESET_QUESTIONS } from '../utils/constants';

interface ScoreboardProps {
  models: ModelDefinition[];
  questionResults: Record<string, QuestionModelResult>;
  codeResults: Record<string, SimpleCodeResult>;
  onClearAllData: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  models,
  questionResults,
  codeResults,
  onClearAllData,
}) => {
  const [copied, setCopied] = useState(false);

  const enabledModels = models.filter((m) => m.enabled);
  const realQuestions = PRESET_QUESTIONS.filter((q) => q.type === 'real');
  const fakeQuestions = PRESET_QUESTIONS.filter((q) => q.type === 'fake');

  const rows: ScoreboardRow[] = enabledModels.map((model) => {
    // 1. Code works count: 1 if user marked 'works', 0 otherwise
    const codeWorksCount = codeResults[model.id]?.verdict === 'works' ? 1 : 0;

    // 2. Facts correct count (real questions where verdict is 'correct')
    let factsCorrect = 0;
    realQuestions.forEach((q) => {
      const res = questionResults[`${q.id}_${model.id}`];
      if (res && res.verdict === 'correct') {
        factsCorrect++;
      }
    });

    // 3. Hallucinations count (fake questions where verdict is 'hallucinated')
    let hallucinations = 0;
    fakeQuestions.forEach((q) => {
      const res = questionResults[`${q.id}_${model.id}`];
      if (res && res.verdict === 'hallucinated') {
        hallucinations++;
      }
    });

    // Total Score Formula: Code Works (1 pt) + Facts Correct (1 pt each, max 3) - Hallucinations (1 pt penalty)
    const totalScore = codeWorksCount + factsCorrect - hallucinations;

    return {
      modelId: model.id,
      modelName: model.name,
      provider:
        model.provider === 'openrouter'
          ? 'OpenRouter'
          : model.provider === 'gemini'
          ? 'Gemini'
          : 'Manual',
      codeWorksCount,
      factsCorrect,
      hallucinations,
      totalScore,
    };
  });

  // Sort: Best total score first, tie-breaker: fewest hallucinations, then most facts correct
  rows.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (a.hallucinations !== b.hallucinations) {
      return a.hallucinations - b.hallucinations;
    }
    return b.factsCorrect - a.factsCorrect;
  });

  // Identify Winner (only if some test was actually done)
  const hasAnyActivity = rows.some((r) => r.codeWorksCount > 0 || r.factsCorrect > 0 || r.hallucinations > 0);
  const winner = hasAnyActivity && rows.length > 0 ? rows[0] : null;

  // Format as Markdown table for copying
  const generateMarkdownTable = () => {
    let md = '| Rank | Model | Code works | Facts correct | Hallucinations | Total |\n';
    md += '| :--- | :--- | :---: | :---: | :---: | :---: |\n';
    rows.forEach((r, idx) => {
      const isW = winner && winner.modelId === r.modelId ? ' 🏆' : '';
      md += `| ${idx + 1} | ${r.modelName}${isW} | ${r.codeWorksCount > 0 ? 'Yes' : 'No'} | ${r.factsCorrect}/3 | ${r.hallucinations} | **${r.totalScore}** |\n`;
    });
    return md;
  };

  const handleCopyTable = () => {
    const md = generateMarkdownTable();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    let csv = 'Rank,Model,Code works,Facts correct,Hallucinations,Total\n';
    rows.forEach((r, idx) => {
      csv += `${idx + 1},"${r.modelName}",${r.codeWorksCount > 0 ? 'Yes' : 'No'},${r.factsCorrect},${r.hallucinations},${r.totalScore}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'llm_hallucination_test_scoreboard.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Winner Spotlight Banner */}
      {winner && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: '#19B6A6',
          }}
          className="relative overflow-hidden border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md transition-all duration-180 max-w-full"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#19B6A6] to-[#F5A524] p-0.5 flex items-center justify-center shrink-0 shadow-sm">
                <div
                  style={{ backgroundColor: 'var(--bg-card)' }}
                  className="w-full h-full rounded-[10px] flex items-center justify-center"
                >
                  <Trophy className="w-6 h-6 text-[#F5A524]" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#19B6A6] bg-[#19B6A6]/15 border border-[#19B6A6]/30 px-2.5 py-0.5 rounded-md">
                    Winner
                  </span>
                  <span
                    style={{ color: 'var(--text-secondary)' }}
                    className="text-xs font-mono font-medium"
                  >
                    Rank #1
                  </span>
                </div>
                <h3
                  style={{ color: 'var(--text-primary)' }}
                  className="text-lg sm:text-xl font-extrabold mt-0.5 truncate tracking-tight"
                >
                  {winner.modelName}
                </h3>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-card)',
              }}
              className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 border px-4 sm:px-6 py-3 rounded-xl shrink-0 w-full lg:w-auto justify-around shadow-xs"
            >
              <div className="text-center">
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-[11px] font-mono font-semibold"
                >
                  Total Score
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#19B6A6] font-mono">
                  {winner.totalScore}
                </div>
              </div>

              <div
                style={{ backgroundColor: 'var(--border-card)' }}
                className="hidden sm:block w-px h-8"
              />

              <div className="text-center">
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-[11px] font-mono font-semibold"
                >
                  Code Works
                </div>
                <div
                  style={{ color: 'var(--text-primary)' }}
                  className="text-base sm:text-lg font-bold font-mono"
                >
                  {winner.codeWorksCount > 0 ? 'Yes (+1)' : 'No (0)'}
                </div>
              </div>

              <div
                style={{ backgroundColor: 'var(--border-card)' }}
                className="hidden sm:block w-px h-8"
              />

              <div className="text-center">
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-[11px] font-mono font-semibold"
                >
                  Facts Correct
                </div>
                <div
                  style={{ color: 'var(--text-primary)' }}
                  className="text-base sm:text-lg font-bold font-mono"
                >
                  {winner.factsCorrect} / 3
                </div>
              </div>

              <div
                style={{ backgroundColor: 'var(--border-card)' }}
                className="hidden sm:block w-px h-8"
              />

              <div className="text-center">
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-[11px] font-mono font-semibold"
                >
                  Hallucinations
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {winner.hallucinations}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Scoreboard Table Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
        className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs transition-colors max-w-full"
      >
        {/* Table Toolbar */}
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b"
        >
          <div>
            <h3
              style={{ color: 'var(--text-primary)' }}
              className="text-base font-bold flex items-center gap-2"
            >
              <Medal className="w-4 h-4 text-[#F5A524] shrink-0" />
              <span>Comparative Scoreboard</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Ranked by total score (accuracy across facts and code minus hallucination penalties)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTable}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-card)',
                color: 'var(--text-primary)',
              }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border hover:border-[#19B6A6] transition-all duration-180 cursor-pointer active:scale-95 shadow-xs"
              aria-label="Copy markdown table to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#19B6A6] shrink-0" />
                  <span className="text-[#19B6A6] font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>Copy table</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#19B6A6] hover:bg-[#169f91] active:scale-95 text-slate-950 rounded-xl transition-all duration-180 shadow-xs cursor-pointer"
              aria-label="Download results as CSV"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={onClearAllData}
              style={{ color: 'var(--text-secondary)' }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 text-xs hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-180 cursor-pointer border border-transparent hover:border-red-400/30"
              title="Reset scores"
              aria-label="Reset all scores"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Scrollable Table Container - Must scroll horizontally inside its own box on small screens without page overflow */}
        <div className="overflow-x-auto w-full max-w-full rounded-xl border border-[var(--border-card)]">
          <table className="w-full min-w-[580px] text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-card)',
                  color: 'var(--text-secondary)',
                }}
                className="border-b font-mono text-[11px] uppercase tracking-wider"
              >
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4 text-center">Code works</th>
                <th className="py-3 px-4 text-center">Facts correct</th>
                <th className="py-3 px-4 text-center">Hallucinations</th>
                <th className="py-3 px-4 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {rows.map((row, idx) => {
                const isWinnerRow = winner && winner.modelId === row.modelId;

                return (
                  <tr
                    key={row.modelId}
                    style={{
                      backgroundColor: isWinnerRow
                        ? 'rgba(25, 182, 166, 0.12)'
                        : undefined,
                    }}
                    className={`transition-colors duration-150 font-mono hover:bg-[var(--bg-surface)] ${
                      isWinnerRow ? 'font-semibold border-l-4 border-l-[#19B6A6]' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-bold">
                      {isWinnerRow ? (
                        <span className="text-[#F5A524] text-base">🏆</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      )}
                    </td>

                    {/* Model Name */}
                    <td className="py-3.5 px-4 font-sans font-bold">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ color: 'var(--text-primary)' }}>{row.modelName}</span>
                        {isWinnerRow && (
                          <span className="text-[10px] text-[#19B6A6] bg-[#19B6A6]/20 border border-[#19B6A6]/30 px-2 py-0.5 rounded-md font-mono font-extrabold uppercase">
                            Winner
                          </span>
                        )}
                        <span
                          style={{ color: 'var(--text-secondary)' }}
                          className="text-[10px] font-mono font-normal opacity-70"
                        >
                          ({row.provider})
                        </span>
                      </div>
                    </td>

                    {/* Code works */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                          row.codeWorksCount > 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {row.codeWorksCount > 0 ? 'Works (+1)' : '—'}
                      </span>
                    </td>

                    {/* Facts Correct */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                          row.factsCorrect > 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {row.factsCorrect} / 3
                      </span>
                    </td>

                    {/* Hallucinations */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                          row.hallucinations === 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {row.hallucinations > 0 ? `-${row.hallucinations}` : '0'}
                      </span>
                    </td>

                    {/* Total Score */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-base sm:text-lg font-extrabold text-[#19B6A6] tabular-nums">
                        {row.totalScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Scoring formula footnote */}
        <div
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          className="mt-4 pt-3 border-t flex items-center gap-2 text-xs leading-relaxed"
        >
          <Info className="w-4 h-4 text-[#19B6A6] shrink-0" />
          <span>
            Total Score = Code works (+1 pt) + Facts correct (+1 pt each, max 3) − Hallucinations (−1 pt penalty each).
          </span>
        </div>
      </div>
    </div>
  );
};
