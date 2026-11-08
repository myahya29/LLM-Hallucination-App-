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
          className="relative overflow-hidden border-2 rounded-2xl p-6 shadow-sm transition-colors"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#19B6A6] to-[#F5A524] p-0.5 flex items-center justify-center shrink-0">
                <div
                  style={{ backgroundColor: 'var(--bg-card)' }}
                  className="w-full h-full rounded-[10px] flex items-center justify-center"
                >
                  <Trophy className="w-6 h-6 text-[#F5A524]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#19B6A6] bg-[#19B6A6]/10 px-2 py-0.5 rounded">
                    Winner
                  </span>
                  <span
                    style={{ color: 'var(--text-secondary)' }}
                    className="text-xs"
                  >
                    Rank #1
                  </span>
                </div>
                <h3
                  style={{ color: 'var(--text-primary)' }}
                  className="text-xl font-extrabold mt-0.5"
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
              className="flex items-center gap-5 border px-5 py-2.5 rounded-xl shrink-0"
            >
              <div className="text-center">
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs font-mono"
                >
                  Total
                </div>
                <div className="text-xl font-extrabold text-[#19B6A6] font-mono">
                  {winner.totalScore}
                </div>
              </div>
              <div
                style={{ backgroundColor: 'var(--border-card)' }}
                className="w-px h-7"
              />
              <div className="text-center">
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs font-mono"
                >
                  Code works
                </div>
                <div
                  style={{ color: 'var(--text-primary)' }}
                  className="text-base font-bold font-mono"
                >
                  {winner.codeWorksCount > 0 ? 'Yes' : 'No'}
                </div>
              </div>
              <div
                style={{ backgroundColor: 'var(--border-card)' }}
                className="w-px h-7"
              />
              <div className="text-center">
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs font-mono"
                >
                  Facts
                </div>
                <div
                  style={{ color: 'var(--text-primary)' }}
                  className="text-base font-bold font-mono"
                >
                  {winner.factsCorrect}/3
                </div>
              </div>
              <div
                style={{ backgroundColor: 'var(--border-card)' }}
                className="w-px h-7"
              />
              <div className="text-center">
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs font-mono"
                >
                  Hallucinations
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
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
        className="border rounded-xl p-5 shadow-sm transition-colors"
      >
        {/* Table Toolbar */}
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b"
        >
          <div>
            <h3
              style={{ color: 'var(--text-primary)' }}
              className="text-base font-bold flex items-center gap-2"
            >
              <Medal className="w-4 h-4 text-[#F5A524]" />
              Scoreboard
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyTable}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-card)',
                color: 'var(--text-primary)',
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border hover:opacity-85 transition-opacity"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#19B6A6]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy table</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#19B6A6] hover:bg-[#169f91] text-slate-950 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={onClearAllData}
              style={{ color: 'var(--text-secondary)' }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:text-red-500 rounded-lg transition-colors"
              title="Reset scores"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-card)',
                  color: 'var(--text-secondary)',
                }}
                className="border-b font-mono text-[11px] uppercase tracking-wider"
              >
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4 text-center">Code works</th>
                <th className="py-3 px-4 text-center">Facts correct</th>
                <th className="py-3 px-4 text-center">Hallucinations</th>
                <th className="py-3 px-4 text-right">Total</th>
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
                        ? 'rgba(25, 182, 166, 0.08)'
                        : undefined,
                    }}
                    className="hover:opacity-90 transition-opacity font-mono"
                  >
                    {/* Model Name */}
                    <td className="py-3 px-4 font-sans font-bold">
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--text-primary)' }}>{row.modelName}</span>
                        {isWinnerRow && (
                          <span className="text-[10px] text-[#19B6A6] bg-[#19B6A6]/20 px-1.5 py-0.5 rounded font-mono font-bold">
                            WINNER
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Code works */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          row.codeWorksCount > 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {row.codeWorksCount > 0 ? 'Works' : '—'}
                      </span>
                    </td>

                    {/* Facts Correct */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          row.factsCorrect > 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {row.factsCorrect} / 3
                      </span>
                    </td>

                    {/* Hallucinations */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          row.hallucinations === 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                        }`}
                      >
                        {row.hallucinations}
                      </span>
                    </td>

                    {/* Total Score */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-base font-extrabold text-[#19B6A6] tabular-nums">
                        {row.totalScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Note */}
        <div
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          className="mt-4 pt-3 border-t flex items-center gap-2 text-xs"
        >
          <Info className="w-4 h-4 text-[#19B6A6] shrink-0" />
          <span>
            Total = Code works (+1) + Facts correct (+1 per question) - Hallucinations (-1 penalty).
          </span>
        </div>
      </div>
    </div>
  );
};
