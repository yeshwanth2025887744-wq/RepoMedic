import React, { useState } from 'react';
import {
  Stethoscope,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ParsedSections, DiagnosisMetadata } from '../types';
import { DiffViewer } from './DiffViewer';
import { RemediationTerminal } from './RemediationTerminal';

interface DiagnosticReportProps {
  rawMarkdown: string;
  sections: ParsedSections;
  metadata: DiagnosisMetadata;
  targetFile?: string;
  onApplyPatch?: (patch: string) => void;
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({
  rawMarkdown,
  sections,
  metadata,
  targetFile = 'package.json',
  onApplyPatch,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'raw'>('visual');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedFixes, setCopiedFixes] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);

  const extractCommands = (text: string): string[] => {
    const commands: string[] = [];
    const codeBlockRegex = /```(?:bash|sh|shell|zsh)?\n([\s\S]*?)```/gi;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const block = match[1];
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
      commands.push(...lines);
    }
    return commands;
  };

  const suggestedCommands = extractCommands(sections.recommendedFixes);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleCopyFixes = () => {
    navigator.clipboard.writeText(sections.recommendedFixes);
    setCopiedFixes(true);
    setTimeout(() => setCopiedFixes(false), 2000);
  };

  const severityColor =
    metadata.severity === 'critical'
      ? 'bg-rose-950/80 text-rose-400 border-rose-800'
      : metadata.severity === 'high'
      ? 'bg-amber-950/80 text-amber-400 border-amber-800'
      : 'bg-cyan-950/80 text-cyan-400 border-cyan-800';

  return (
    <div className="space-y-6">
      {/* Report Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-cyan-950 flex items-center justify-center border border-cyan-800/80">
            <Stethoscope className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">RepoMedic Diagnostic Audit</h2>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border font-mono ${severityColor}`}>
                {metadata.severity}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Ecosystem: <span className="text-cyan-300 uppercase">{metadata.ecosystem}</span> • Audited at{' '}
              {new Date(metadata.analyzedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'visual' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Formatted Report
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'raw' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Markdown
            </button>
          </div>

          <button
            onClick={handleCopyRaw}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-all"
            title="Copy full diagnosis markdown"
          >
            {copiedRaw ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedRaw ? 'Copied' : 'Copy All'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'raw' ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-xl">
          {rawMarkdown}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. 🩺 Diagnosis Summary */}
          <div className="rounded-xl border border-cyan-900/60 bg-gradient-to-br from-slate-950 via-slate-900/90 to-cyan-950/20 p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1 bg-cyan-500"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🩺</span>
              <h3 className="text-base font-bold text-cyan-300 font-mono tracking-tight">
                Diagnosis Summary
              </h3>
            </div>
            <div className="text-sm font-medium text-slate-200 leading-relaxed pl-1 border-l-2 border-cyan-800/40 ml-1">
              {sections.diagnosisSummary ? (
                <p className="whitespace-pre-line">{sections.diagnosisSummary}</p>
              ) : (
                <p className="text-slate-400">Diagnosis summary pending or incomplete.</p>
              )}
            </div>
          </div>

          {/* 2. 🔍 Root Cause Analysis */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <h3 className="text-base font-bold text-indigo-300 font-mono tracking-tight">
                  Root Cause Analysis
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Deep Inspection</span>
            </div>
            <div className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
              {sections.rootCause || 'Root cause details not identified.'}
            </div>
          </div>

          {/* 3. 🛠️ Recommended Fixes */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛠️</span>
                <h3 className="text-base font-bold text-amber-300 font-mono tracking-tight">
                  Recommended Fixes
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFixes}
                  className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {copiedFixes ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedFixes ? 'Copied' : 'Copy Steps'}</span>
                </button>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-line mb-4">
              {sections.recommendedFixes || 'No remediation instructions provided.'}
            </div>

            {/* Embedded Remediation Runner */}
            {suggestedCommands.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                    Interactive Remediation Console
                  </span>
                  <button
                    onClick={() => setShowTerminal(!showTerminal)}
                    className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 font-mono"
                  >
                    {showTerminal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    <span>{showTerminal ? 'Hide Terminal' : 'Show Terminal'}</span>
                  </button>
                </div>

                {showTerminal && (
                  <RemediationTerminal
                    suggestedCommands={suggestedCommands}
                    ecosystem={metadata.ecosystem}
                  />
                )}
              </div>
            )}
          </div>

          {/* 4. 📝 Patch / Code Diff */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h3 className="text-base font-bold text-emerald-300 font-mono tracking-tight">
                  Patch / Code Diff
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Drop-in Replacement</span>
            </div>

            {sections.patchDiff ? (
              <DiffViewer
                diffContent={sections.patchDiff}
                targetFile={targetFile}
                onApplyPatch={onApplyPatch}
              />
            ) : (
              <div className="text-xs font-mono text-slate-500 p-4 rounded bg-slate-900 border border-slate-800">
                No code diff generated for this issue.
              </div>
            )}
          </div>

          {/* 5. 🛡️ Prevention Tip */}
          <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/30 p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1 bg-indigo-500"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🛡️</span>
              <h3 className="text-base font-bold text-indigo-300 font-mono tracking-tight">
                Prevention Tip
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-200 leading-relaxed pl-1 border-l-2 border-indigo-800/40 ml-1">
              <p className="whitespace-pre-line">
                {sections.preventionTip || 'Implement automated CI linting and dependency lockfile verification.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
