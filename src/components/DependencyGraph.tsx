import React from 'react';
import { GitBranch, AlertOctagon, CheckCircle, Layers } from 'lucide-react';

interface ConflictItem {
  package: string;
  demandedBy: string;
  requiredVersion: string;
  currentVersion: string;
  status: 'conflict' | 'compatible' | 'deprecated';
}

interface DependencyGraphProps {
  rootName?: string;
  conflicts?: ConflictItem[];
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  rootName = 'root-project',
  conflicts = [],
}) => {
  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center font-mono text-xs text-slate-500">
        <Layers className="h-6 w-6 mx-auto mb-2 text-slate-600" />
        No active package dependency graph loaded. Load an incident preset or run analysis to view peer collisions.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Dependency Conflict Matrix &amp; Resolution Tree</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
          Strict Peer Collision Detected
        </span>
      </div>

      {/* Root Node */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-200 font-semibold shadow-md">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
          <span>Root Target: {rootName}</span>
        </div>
      </div>

      {/* Branch Lines and Conflict Cards */}
      <div className="space-y-3 pl-4 border-l-2 border-indigo-900/60 ml-3">
        {conflicts.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border transition-all ${
              item.status === 'conflict'
                ? 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                : item.status === 'deprecated'
                ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
                : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold">
                {item.status === 'conflict' ? (
                  <AlertOctagon className="h-4 w-4 text-rose-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                )}
                <span>Package: {item.package}</span>
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  item.status === 'conflict'
                    ? 'bg-rose-900/60 text-rose-200'
                    : 'bg-emerald-900/60 text-emerald-200'
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Demanded By:</span>
                <span className="font-semibold text-slate-200">{item.demandedBy}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Requirement vs Installed:</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold">{item.requiredVersion}</span>
                  <span className="text-slate-500">≠</span>
                  <span className="text-rose-400 font-semibold">{item.currentVersion}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
