import { IncidentPreset } from '../types';

export const INCIDENT_PRESETS: IncidentPreset[] = [
  {
    id: 'react19-peer-conflict',
    title: 'React 19 Peer Dependency Hell & Webpack Polyfills',
    badge: 'NPM ERESOLVE',
    ecosystem: 'node',
    category: 'dependency',
    severity: 'critical',
    description: 'npm v10 halts installation under strict tree validation because react-router-dom@6.15.0 insists on react@^18.0.0, and Webpack 5 fails on missing Node crypto/stream polyfills.',
    targetFile: 'package.json',
    context: `{
  "name": "enterprise-portal",
  "version": "2.4.0",
  "type": "module",
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "6.15.0",
    "framer-motion": "10.12.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.4"
  }
}`,
    logs: `npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR! 
npm ERR! While resolving: react-router-dom@6.15.0
npm ERR! Found: react@19.0.0
npm ERR! node_modules/react
npm ERR!   react@"^19.0.0" from the root project
npm ERR! 
npm ERR! Could not resolve dependency:
npm ERR! peer react@">=16.8" from react-router-dom@6.15.0
npm ERR!   conflicting peer dependency: react@^18.0.0 requested by react-router-dom
npm ERR! 
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force or --legacy-peer-deps
npm ERR! to accept an incorrect (and potentially broken) dependency resolution.
npm ERR!
[webpack-cli] Breakage in ./src/auth/jwt.ts
Module not found: Error: Can't resolve 'crypto' in '/app/src/auth'
BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
This is no longer the case. Verify if you need this module and configure a polyfill for it.`,
    conflictGraph: {
      root: 'enterprise-portal',
      conflicts: [
        {
          package: 'react',
          demandedBy: 'root (package.json)',
          requiredVersion: '^19.0.0',
          currentVersion: '19.0.0',
          status: 'conflict',
        },
        {
          package: 'react',
          demandedBy: 'react-router-dom@6.15.0',
          requiredVersion: '^18.0.0 || ^18.2.0',
          currentVersion: '19.0.0',
          status: 'conflict',
        },
        {
          package: 'framer-motion',
          demandedBy: 'root',
          requiredVersion: '10.12.0 (React 18 peer)',
          currentVersion: '10.12.0',
          status: 'deprecated',
        },
      ],
    },
  },
  {
    id: 'docker-alpine-musl-segfault',
    title: 'Alpine Linux Musl libc Segfault with NumPy C-Extension',
    badge: 'SIGSEGV MUSL',
    ecosystem: 'docker',
    category: 'config',
    severity: 'critical',
    description: 'FastAPI microservice running in Python 3.11-alpine crashes instantly on import of native C-extensions due to ABI mismatch between GNU libc and Alpine musl libc.',
    targetFile: 'Dockerfile',
    context: `FROM python:3.11-alpine

WORKDIR /usr/src/app

COPY requirements.txt .

RUN apk add --no-cache gcc
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`,
    logs: `Step 6/8 : RUN pip install --no-cache-dir -r requirements.txt
Collecting numpy==1.26.4
  Downloading numpy-1.26.4.tar.gz (15.8 MB)
  Installing build dependencies ... done
  Getting requirements to build wheel ... done
  Preparing metadata (pyproject.toml) ... done
Building wheels for collected packages: numpy
  Building wheel for numpy (pyproject.toml) ... error
  error: subprocess-exited-with-error
  
  gcc -pthread -Wno-unused-result -Wsign-compare -DNDEBUG -g -fwrapv -O3 -Wall -fPIC -I/usr/include/python3.11 -c numpy/core/src/multiarray/alloc.c
  numpy/core/src/multiarray/alloc.c:14:10: fatal error: execinfo.h: No such file or directory
     14 | #include <execinfo.h>
        |          ^~~~~~~~~~~~
  compilation terminated.
  
  Fatal Python error: Segmentation fault
  Current thread 0x00007f9b8b320b80 (most recent call first):
  File "/usr/local/lib/python3.11/site-packages/numpy/__init__.py", line 130 in <module>
  Segmentation fault (core dumped)`,
  },
  {
    id: 'vitest-esm-mock-hoisting',
    title: 'Vitest / Jest ESM Mock Hoist & Asynchronous Resource Leak',
    badge: 'ESM HOIST ERROR',
    ecosystem: 'node',
    category: 'test_failure',
    severity: 'high',
    description: 'Mocking service instances fails with ReferenceError because vi.mock is hoisted above module lexical scope variables, and worker process hangs due to dangling database pool timers.',
    targetFile: 'src/services/__tests__/billing.test.ts',
    context: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from '../billing';
import { StripeClient } from '../../clients/stripe';

// Define local mock factory variable
const mockChargeFn = vi.fn().mockResolvedValue({ id: 'ch_123', status: 'succeeded' });

// vi.mock is hoisted to the very top of the file!
vi.mock('../../clients/stripe', () => {
  return {
    StripeClient: vi.fn().mockImplementation(() => ({
      createCharge: mockChargeFn, // FAILS: mockChargeFn is accessed before lexical declaration!
    })),
  };
});

describe('BillingService', () => {
  it('processes payment successfully', async () => {
    const service = new BillingService(new StripeClient());
    const res = await service.chargeUser('user_42', 5000);
    expect(res.status).toBe('succeeded');
  });
});`,
    logs: `FAIL src/services/__tests__/billing.test.ts
  ● Test suite failed to run

    ReferenceError: Cannot access 'mockChargeFn' before initialization
      at src/services/__tests__/billing.test.ts:7:21
      at Object.<anonymous> (src/services/__tests__/billing.test.ts:6:1)

      6 | vi.mock('../../clients/stripe', () => {
      7 |   return {
    > 8 |     StripeClient: vi.fn().mockImplementation(() => ({
      9 |       createCharge: mockChargeFn,
        |                     ^
     10 |     })),
     11 |   };
     12 | });

A worker process has failed to exit gracefully and has been force exited.
This is likely caused by tests leaking asynchronous resources (e.g. open database pools or unref'd setInterval).`,
  },
  {
    id: 'python-numpy2-abi-breakage',
    title: 'Python Poetry / pip NumPy 2.0 ABI C-Extension Incompatibility',
    badge: 'ABI MISMATCH',
    ecosystem: 'python',
    category: 'dependency',
    severity: 'critical',
    description: 'NumPy 2.0 changed its C-API struct size. Packages compiled against NumPy 1.x (such as pandas or scipy wheels) throw fatal ValueError at runtime.',
    targetFile: 'pyproject.toml',
    context: `[tool.poetry]
name = "data-analytics-engine"
version = "1.0.0"
description = "Fast real-time financial modeling"
authors = ["Dev Team <dev@company.internal>"]

[tool.poetry.dependencies]
python = "^3.11"
numpy = "^2.0.0"
pandas = "2.1.4"
scipy = "1.11.4"
fastapi = "^0.110.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"`,
    logs: `Traceback (most recent call last):
  File "/app/main.py", line 4, in <module>
    import pandas as pd
  File "/usr/local/lib/python3.11/site-packages/pandas/__init__.py", line 22, in <module>
    from pandas.compat import is_numpy_dev
  File "/usr/local/lib/python3.11/site-packages/pandas/core/dtypes/common.py", line 16, in <module>
    from pandas._libs import lib
  File "pandas/_libs/lib.pyx", line 1, in init pandas._libs.lib
ValueError: numpy.dtype size changed, may indicate binary incompatibility. Expected 96 from C header, got 88 from PyObject
RuntimeError: module compiled against API version 0x10 but this version of numpy is 0x12`,
  },
  {
    id: 'rust-tokio-send-sync-lifetime',
    title: 'Rust Tokio Spawn Send+Sync Concurrency Lifetime Violation',
    badge: 'RUST E0277',
    ecosystem: 'rust',
    category: 'code_change',
    severity: 'high',
    description: 'Rust compiler halts compilation with error[E0277] because an Rc<RefCell<State>> is moved into a multi-threaded tokio::spawn task where Send + Sync is strictly required.',
    targetFile: 'src/main.rs',
    context: `use std::rc::Rc;
use std::cell::RefCell;
use tokio::time::{sleep, Duration};

struct WorkerState {
    counter: usize,
}

#[tokio::main]
async fn main() {
    let state = Rc::new(RefCell::new(WorkerState { counter: 0 }));

    // Spawn concurrent tokio task across thread pool
    tokio::spawn(async move {
        loop {
            state.borrow_mut().counter += 1;
            sleep(Duration::from_millis(500)).await;
        }
    });

    sleep(Duration::from_secs(2)).await;
}`,
    logs: `error[E0277]: \`Rc<RefCell<WorkerState>>\` cannot be sent between threads safely
   --> src/main.rs:14:18
    |
 14 |       tokio::spawn(async move {
    |  _____------------_^
    | |     |
    | |     required by a bound introduced by this call
 15 | |         loop {
 16 | |             state.borrow_mut().counter += 1;
 17 | |             sleep(Duration::from_millis(500)).await;
 18 | |         }
 19 | |     });
    | |_____^ \`Rc<RefCell<WorkerState>>\` cannot be sent between threads safely
    |
    = help: the trait \`Send\` is not implemented for \`Rc<RefCell<WorkerState>>\`
note: required by a bound in \`tokio::spawn\`
   --> /cargo/registry/src/tokio-1.35.0/src/task/spawn.rs:166:21
    |
166 |         T: Future + Send + 'static,
    |                     ^^^^ required by this bound in \`spawn\``,
  },
  {
    id: 'k8s-crashloopbackoff-config',
    title: 'Kubernetes CrashLoopBackOff via Missing Environment Secret',
    badge: 'K8S CRASHLOOP',
    ecosystem: 'k8s',
    category: 'config',
    severity: 'critical',
    description: 'Production deployment pod restarts repeatedly with CrashLoopBackOff because an unpopulated SecretKeyRef in the Helm deployment causes the web application container to exit with code 1.',
    targetFile: 'deploy/helm/templates/deployment.yaml',
    context: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-gateway
  labels:
    app.kubernetes.io/name: payment-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-gateway
  template:
    metadata:
      labels:
        app: payment-gateway
    spec:
      containers:
        - name: server
          image: gcr.io/corp/payment-gateway:v3.2.1
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials-prod
                  key: database_url_v2   # Key does not exist in K8s secret!
            - name: NODE_ENV
              value: "production"`,
    logs: `kubectl get pods -n production
NAME                               READY   STATUS             RESTARTS      AGE
payment-gateway-7b89f68894-c8d4f   0/1     CrashLoopBackOff   6 (90s ago)   14m
payment-gateway-7b89f68894-k2x9m   0/1     CrashLoopBackOff   6 (85s ago)   14m

kubectl logs payment-gateway-7b89f68894-c8d4f -n production
[FATAL] 2026-10-25T15:10:02.194Z Boot sequence failed.
Error: [ConfigValidation] Required environment variable 'DATABASE_URL' is missing or null.
    at Object.validateConfig (/app/dist/config.js:42:15)
    at Object.<anonymous> (/app/dist/server.js:12:28)
Process exited with status 1.

Events:
  Warning  Failed     14m (x7 over 16m)  kubelet  Error: couldn't find key database_url_v2 in Secret production/postgres-credentials-prod`,
  },
];
