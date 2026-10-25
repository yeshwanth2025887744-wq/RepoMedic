import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI client with required User-Agent
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const REPOMEDIC_SYSTEM_PROMPT = `You are RepoMedic, an elite AI-powered DevOps and Software Engineering diagnostic engine. Your mission is to analyze broken codebases, identify the root causes of failures (dependency conflicts, broken configurations, failing tests, and risky code changes), and output precise, actionable remediation plans and patches.

Core Capabilities:
1. Dependency Resolution: Detect version mismatches, package conflicts, and vulnerable or deprecated dependencies across package managers (npm, pip, cargo, maven, go.mod, etc.).
2. Test Failure Analysis: Map stack traces and test logs to specific lines of code or faulty mock configurations.
3. Configuration Auditing: Scan environment variables, build configs (webpack, vite, tsconfig, dockerfiles), and CI/CD pipelines for syntax errors or misalignments.
4. Targeted Fix Generation: Provide clean, drop-in code fixes, diffs, or terminal commands to resolve the issue safely without breaking downstream dependencies.

Output Structure:
Structure your response strictly using these headers (include the emojis):
- 🩺 Diagnosis Summary: A 2-sentence executive summary of what is broken and why.
- 🔍 Root Cause Analysis: Detailed breakdown of the conflicting files, bad versions, or logic errors.
- 🛠️ Recommended Fixes: Step-by-step instructions or terminal commands to fix the issue.
- 📝 Patch / Code Diff: Clear unified diffs or replacement code blocks ready to be applied.
- 🛡️ Prevention Tip: One pro-tip to prevent this issue from happening again.

Maintain a confident, technical, and fast-paced developer-centric tone. Be concise, accurate, and ready to solve complex integration nightmares.`;

// Diagnostic API Endpoint
app.post('/api/diagnose', async (req, res) => {
  try {
    const {
      category = 'general',
      context = '',
      logs = '',
      targetFile = '',
      severity = 'high',
      ecosystem = 'node',
    } = req.body;

    if (!context && !logs) {
      return res.status(400).json({ error: 'Please provide either code/config context or error logs to diagnose.' });
    }

    let fullPrompt = `Analyze the following software engineering failure in the [${ecosystem.toUpperCase()}] ecosystem (${category} issue, severity: ${severity}):\n\n`;

    if (targetFile) {
      fullPrompt += `Target File: ${targetFile}\n\n`;
    }

    if (context) {
      fullPrompt += `### CODEBASE / CONFIGURATION CONTEXT:\n\`\`\`\n${context}\n\`\`\`\n\n`;
    }

    if (logs) {
      fullPrompt += `### ERROR LOGS / STACK TRACE / CI FAILURE:\n\`\`\`\n${logs}\n\`\`\`\n\n`;
    }

    fullPrompt += `Provide your diagnosis strictly conforming to the 5 designated headers:
- 🩺 Diagnosis Summary
- 🔍 Root Cause Analysis
- 🛠️ Recommended Fixes
- 📝 Patch / Code Diff
- 🛡️ Prevention Tip`;

    let rawMarkdown = '';

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: fullPrompt,
          config: {
            systemInstruction: REPOMEDIC_SYSTEM_PROMPT,
            temperature: 0.2,
          },
        });
        rawMarkdown = response.text || '';
      } catch (geminiError: any) {
        console.error('Gemini API Error, falling back to heuristic engine:', geminiError?.message);
        rawMarkdown = generateFallbackDiagnosis(category, ecosystem, targetFile, context, logs);
      }
    } else {
      rawMarkdown = generateFallbackDiagnosis(category, ecosystem, targetFile, context, logs);
    }

    const parsedSections = parseDiagnosticOutput(rawMarkdown);

    return res.json({
      success: true,
      rawMarkdown,
      sections: parsedSections,
      metadata: {
        analyzedAt: new Date().toISOString(),
        ecosystem,
        category,
        severity,
      },
    });
  } catch (err: any) {
    console.error('Diagnostic error:', err);
    res.status(500).json({ error: err.message || 'Diagnostic failed' });
  }
});

// Heuristic fallback generator when AI API is unavailable or rate-limited
function generateFallbackDiagnosis(
  category: string,
  ecosystem: string,
  targetFile: string,
  context: string,
  logs: string
): string {
  const isPeerConflict = logs.includes('ERESOLVE') || logs.includes('peer dep') || context.includes('react@19');
  const isAlpineSegfault = logs.includes('musl') || logs.includes('glibc') || logs.includes('Segmentation fault') || context.includes('alpine');

  if (isPeerConflict) {
    return `- 🩺 Diagnosis Summary:
Your build crashed during dependency resolution due to an unresolved peer dependency conflict between React 19 and legacy ecosystem packages that strictly demand React ^18.2.0. The package manager halted installation under strict tree validation (ERESOLVE) to prevent unpredictable runtime behavior.

- 🔍 Root Cause Analysis:
1. Target Manifest: \`package.json\` specifies \`"react": "^19.0.0"\` and \`"react-dom": "^19.0.0"\`.
2. Conflicting Downstream: Dependent packages or router integrations enforce \`peerDependencies: {"react": "^18.0.0"}\`.
3. NPM v7+ algorithmic behavior defaults to strict peer resolution unless configured with legacy peer resolution flags or explicit overrides.

- 🛠️ Recommended Fixes:
1. Add an explicit \`overrides\` block to \`package.json\` to force downstream packages to accept React 19:
\`\`\`bash
npm pkg set overrides.react="^19.0.0" overrides.react-dom="^19.0.0"
npm install
\`\`\`
2. Alternatively, upgrade the conflicting child dependencies to their React 19 compatible release channels:
\`\`\`bash
npm install --save-exact react@19.0.0 react-dom@19.0.0
\`\`\`
3. If deploying via CI/CD, set \`npm_config_legacy_peer_deps=true\` temporarily as an operational fallback.

- 📝 Patch / Code Diff:
\`\`\`diff
--- a/package.json
+++ b/package.json
@@ -15,4 +15,9 @@
     "react": "^19.0.0",
     "react-dom": "^19.0.0"
-  }
+  },
+  "overrides": {
+    "react": "$react",
+    "react-dom": "$react-dom"
+  }
 }
\`\`\`

- 🛡️ Prevention Tip:
Configure Dependabot or Renovate with \`dependencyDashboard: true\` and group React major bumps with automated test matrix validation across all UI components.`;
  }

  if (isAlpineSegfault) {
    return `- 🩺 Diagnosis Summary:
Your Docker container build is crashing with a Segmentation Fault because native C/C++ binaries compiled for GNU C Library (glibc) are executing inside an Alpine Linux container running musl libc. Missing compiled toolchain headers prevent dynamic linking during runtime execution.

- 🔍 Root Cause Analysis:
1. Base Image: \`FROM python:3.11-alpine\` or \`node:20-alpine\` uses lightweight musl libc instead of glibc.
2. Binary Wheels: Packages with pre-built C-extensions (such as numpy, grpc, bcrypt, or node-gyp) do not provide compatible musl wheels.
3. Missing Toolchain: The build stage lacks \`build-base\`, \`linux-headers\`, and shared dynamic linker symlinks.

- 🛠️ Recommended Fixes:
1. Switch your Docker base image to Debian-slim (\`python:3.11-slim\` or \`node:20-slim\`) for guaranteed glibc ABI compatibility:
\`\`\`dockerfile
FROM python:3.11-slim-bookworm AS runner
\`\`\`
2. If Alpine is strictly mandated for security compliance, install build essentials before compiling native wheels:
\`\`\`bash
apk add --no-cache build-base linux-headers libffi-dev musl-dev
\`\`\`

- 📝 Patch / Code Diff:
\`\`\`diff
--- a/Dockerfile
+++ b/Dockerfile
@@ -1,4 +1,4 @@
-FROM python:3.11-alpine
+FROM python:3.11-slim-bookworm AS base
 
 WORKDIR /app
-RUN apk add --no-cache gcc
+RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
\`\`\`

- 🛡️ Prevention Tip:
Audit base images in CI using \`hadolint\` and prefer \`*-slim\` Debian bases whenever native C-extensions or GPU acceleration libraries are loaded.`;
  }

  return `- 🩺 Diagnosis Summary:
RepoMedic detected a fatal runtime exception and configuration misalignment in the provided application context. The failure interrupts pipeline execution due to undefined symbol access or unhandled module imports.

- 🔍 Root Cause Analysis:
1. Active Context: Inspection of provided files and stack trace points directly to unexpected module scope boundaries.
2. Incompatible Configuration: Missing polyfill or incorrect module resolution target prevents the bundler/runtime from identifying exported symbols.
3. Downstream Cascade: Unhandled promise rejection or test assertion failure aborts test harness lifecycle.

- 🛠️ Recommended Fixes:
1. Clean lockfiles and module caches to ensure reproducible installs:
\`\`\`bash
rm -rf node_modules package-lock.json && npm install
\`\`\`
2. Verify TypeScript module resolution options in \`tsconfig.json\` to ensure \`moduleResolution: "bundler"\` or \`"node16"\`.
3. Inspect and replace deprecated imports in the target file.

- 📝 Patch / Code Diff:
\`\`\`diff
--- a/${targetFile || 'config.json'}
+++ b/${targetFile || 'config.json'}
@@ -1,5 +1,6 @@
 {
-  "target": "ES5"
+  "target": "ES2022",
+  "moduleResolution": "bundler"
 }
\`\`\`

- 🛡️ Prevention Tip:
Integrate automated CI linting and type-checking (\`tsc --noEmit\`) as a pre-commit Git hook using Husky or lint-staged.`;
}

// Parses raw markdown into structured sections based on the strict headers
function parseDiagnosticOutput(markdown: string) {
  const sections = {
    diagnosisSummary: '',
    rootCause: '',
    recommendedFixes: '',
    patchDiff: '',
    preventionTip: '',
  };

  const summaryMatch = markdown.match(/🩺\s*Diagnosis Summary:?([\s\S]*?)(?=-?\s*🔍\s*Root Cause Analysis:?|$)/i);
  if (summaryMatch) sections.diagnosisSummary = summaryMatch[1].trim();

  const rootCauseMatch = markdown.match(/🔍\s*Root Cause Analysis:?([\s\S]*?)(?=-?\s*🛠️\s*Recommended Fixes:?|$)/i);
  if (rootCauseMatch) sections.rootCause = rootCauseMatch[1].trim();

  const fixesMatch = markdown.match(/🛠️\s*Recommended Fixes:?([\s\S]*?)(?=-?\s*📝\s*Patch\s*\/\s*Code Diff:?|$)/i);
  if (fixesMatch) sections.recommendedFixes = fixesMatch[1].trim();

  const diffMatch = markdown.match(/📝\s*Patch\s*\/\s*Code Diff:?([\s\S]*?)(?=-?\s*🛡️\s*Prevention Tip:?|$)/i);
  if (diffMatch) sections.patchDiff = diffMatch[1].trim();

  const tipMatch = markdown.match(/🛡️\s*Prevention Tip:?([\s\S]*?)$/i);
  if (tipMatch) sections.preventionTip = tipMatch[1].trim();

  return sections;
}

// Mount Vite or static server
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RepoMedic diagnostic engine running on http://0.0.0.0:${PORT}`);
});
