export type Ecosystem = 'node' | 'python' | 'rust' | 'docker' | 'go' | 'k8s';

export type IssueCategory = 'dependency' | 'test_failure' | 'config' | 'code_change' | 'general';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ParsedSections {
  diagnosisSummary: string;
  rootCause: string;
  recommendedFixes: string;
  patchDiff: string;
  preventionTip: string;
}

export interface DiagnosisMetadata {
  analyzedAt: string;
  ecosystem: Ecosystem;
  category: IssueCategory;
  severity: Severity;
}

export interface DiagnosisResponse {
  success: boolean;
  rawMarkdown: string;
  sections: ParsedSections;
  metadata: DiagnosisMetadata;
}

export interface IncidentPreset {
  id: string;
  title: string;
  badge: string;
  ecosystem: Ecosystem;
  category: IssueCategory;
  severity: Severity;
  description: string;
  targetFile: string;
  context: string;
  logs: string;
  conflictGraph?: {
    root: string;
    conflicts: Array<{
      package: string;
      demandedBy: string;
      requiredVersion: string;
      currentVersion: string;
      status: 'conflict' | 'compatible' | 'deprecated';
    }>;
  };
}

export interface TerminalEntry {
  id: string;
  type: 'cmd' | 'stdout' | 'stderr' | 'success' | 'info';
  text: string;
  timestamp: string;
}
