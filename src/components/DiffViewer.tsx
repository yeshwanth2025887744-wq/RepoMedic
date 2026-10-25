import React, { useState } from 'react';
import { Copy, Check, Download, Zap, Columns, AlignLeft } from 'lucide-react';

interface DiffViewerProps {
  diffContent: string;
  targetFile?: string;
  onApplyPatch?: (patch: string) => void;
}

interface DiffLine {
  type: 'add' | 'del' | 'header' | 'context' | 'info';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffContent,
  targetFile = 'modified-file',
  onApplyPatch,
}) => {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  const cleanDiff = diffContent
    .replace(/^```diff\s*/i, '')
    .replace(/^```[\w-]*\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([cleanDiff], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetFile.replace(/[\/\\]/g, '_')}.patch`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    if (onApplyPatch) {
      onApplyPatch(cleanDiff);
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    }
  };

  const lines = cleanDiff.split('\n');
  let oldLine = 1;
  let newLine = 1;

  const parsedLines: DiffLine[] = lines.map((line) => {
    if (line.startsWith('---') || line.startsWith('+++')) {
      return { type: 'header', content: line };
    }
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      return { type: 'info', content: line };
    }
    if (line.startsWith('+')) {
      const num = newLine++;
      return { type: 'add', content: line, newLineNumber: num };
    }
    if (line.startsWith('-')) {
      const num = oldLine++;
      return { type: 'del', content: line, oldLineNumber: num };
    }
    const oNum = oldLine++;
    const nNum = newLine++;
    return { type: 'context', content: line, oldLineNumber: oNum, newLineNumber: nNum };
  });

  const splitLeftLines = parsedLines.filter((l) => l.type !== 'add');
  const splitRightLines = parsedLines.filter((l) => l.type !== 'del');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
      {/* Diff Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-300">
            {targetFile || 'Target Patch'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            Unified Diff
          </span>
          {applied && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse">
              ⚡ Patch Applied to Context
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('unified')}
              className={`p-1 px-2 rounded flex items-center gap-1 font-mono transition-colors ${
                viewMode === 'unified' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Unified View"
            >
              <AlignLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Unified</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1 px-2 rounded flex items-center gap-1 font-mono transition-colors ${
                viewMode === 'split' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-Side Split View"
            >
              <Columns className="h-3 w-3" />
              <span className="hidden sm:inline">Split</span>
            </button>
          </div>

          {/* Simulate Apply Patch */}
          {onApplyPatch && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
              title="Apply patch modifications directly into the workspace context editor"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Apply Patch</span>
            </button>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Copy diff contents"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Download .patch file"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="overflow-x-auto max-h-[460px] font-mono text-xs">
        {viewMode === 'unified' ? (
          <div className="min-w-full inline-block divide-y divide-slate-900/60">
            {parsedLines.map((line, idx) => {
              let bg = 'hover:bg-slate-900/50';

              if (line.type === 'del') {
                bg = 'bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 border-l-2 border-rose-500';
              } else if (line.type === 'add') {
                bg = 'bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-300 border-l-2 border-emerald-500';
              } else if (line.type === 'info') {
                bg = 'bg-cyan-950/20 text-cyan-400 border-l-2 border-cyan-600 font-semibold';
              } else if (line.type === 'header') {
                bg = 'bg-slate-900 text-slate-400 font-bold';
              }

              return (
                <div key={idx} className={`flex items-stretch py-0.5 px-3 leading-relaxed ${bg}`}>
                  <div className="w-10 text-right pr-2 text-slate-600 select-none text-[11px]">
                    {line.oldLineNumber || ''}
                  </div>
                  <div className="w-10 text-right pr-3 text-slate-600 select-none text-[11px]">
                    {line.newLineNumber || ''}
                  </div>
                  <div className="flex-1 whitespace-pre font-mono">
                    {line.content}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-800 min-w-[700px]">
            <div className="divide-y divide-slate-900/60">
              <div className="px-3 py-1 bg-slate-900/90 text-slate-400 font-bold text-[11px] sticky top-0 border-b border-slate-800">
                Original (Base)
              </div>
              {splitLeftLines.map((line, idx) => (
                <div
                  key={`left-${idx}`}
                  className={`flex items-stretch py-0.5 px-2 leading-relaxed ${
                    line.type === 'del'
                      ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                      : line.type === 'info'
                      ? 'bg-cyan-950/20 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="w-8 text-right pr-2 text-slate-600 select-none text-[11px]">
                    {line.oldLineNumber || ''}
                  </div>
                  <div className="flex-1 whitespace-pre">{line.content}</div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-900/60">
              <div className="px-3 py-1 bg-slate-900/90 text-slate-400 font-bold text-[11px] sticky top-0 border-b border-slate-800">
                Proposed Remediation
              </div>
              {splitRightLines.map((line, idx) => (
                <div
                  key={`right-${idx}`}
                  className={`flex items-stretch py-0.5 px-2 leading-relaxed ${
                    line.type === 'add'
                      ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500'
                      : line.type === 'info'
                      ? 'bg-cyan-950/20 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="w-8 text-right pr-2 text-slate-600 select-none text-[11px]">
                    {line.newLineNumber || ''}
                  </div>
                  <div className="flex-1 whitespace-pre">{line.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
