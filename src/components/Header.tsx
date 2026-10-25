import React from 'react';
import { Activity, BookOpen, RotateCcw } from 'lucide-react';
import { Ecosystem } from '../types';

interface HeaderProps {
  activeEcosystem: Ecosystem;
  onSelectEcosystem: (eco: Ecosystem) => void;
  onOpenPresets: () => void;
  onReset: () => void;
  isDiagnosing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeEcosystem,
  onSelectEcosystem,
  onOpenPresets,
  onReset,
  isDiagnosing,
}) => {
  const ecosystems: { id: Ecosystem; label: string }[] = [
    { id: 'node', label: 'Node / TS' },
    { id: 'python', label: 'Python' },
    { id: 'docker', label: 'Docker' },
    { id: 'rust', label: 'Rust' },
    { id: 'k8s', label: 'K8s' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark, one line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 p-0.5 shadow-md shadow-cyan-950">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-mono whitespace-nowrap">
            Repo<span className="text-cyan-400">Medic</span>
          </span>
        </div>

        {/* Zone 2: 4-5 single-line ecosystem / filter links */}
        <div className="hidden md:flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1">
          {ecosystems.map((eco) => (
            <button
              key={eco.id}
              onClick={() => onSelectEcosystem(eco.id)}
              className={`px-3 py-1 text-xs font-mono rounded transition-all whitespace-nowrap shrink-0 ${
                activeEcosystem === eco.id
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {eco.label}
            </button>
          ))}
        </div>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 text-xs font-mono font-medium transition-all shadow-sm whitespace-nowrap"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span>Incident Presets</span>
          </button>

          <button
            onClick={onReset}
            disabled={isDiagnosing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Reset workspace"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </header>
  );
};
