import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AlertTriangle, TrendingUp, BarChart3, FileText,
  CheckCircle2, ChevronRight, ChevronDown, Search, Eye,
  XCircle, Info, ShieldCheck, Settings, ListOrdered,
  Pause, Play, ArrowDown, MoreHorizontal, RotateCw,
  Wrench, ExternalLink, Globe2,
  Check, Plus, Copy, Bell, Key, Hash
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';

/* ═══════════════════════════════════════════════════════════════
   SEVERITY MODEL — weighted, not binary
   ─────────────────────────────────────────────────────────────── */

const SEVERITY = { ok: 0, minor: 1, major: 2, crit: 3 };

// Weighted rollup: 1 critical signal → critical
//                  1 major signal OR 3+ minor signals → attention
//                  otherwise → healthy
const deriveStatus = (sub) => {
  const scores = Object.values(sub).map(s => SEVERITY[s] ?? 0);
  const max = Math.max(...scores);
  const minorCount = scores.filter(s => s === 1).length;
  if (max >= 3) return 'critical';
  if (max >= 2 || minorCount >= 3) return 'attention';
  return 'healthy';
};

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA — reconciles end-to-end, with time dimensions
   ─────────────────────────────────────────────────────────────── */

const activeRuns = [
  {
    id: 'code-gen-7b/pretrain-v3', model: 'code-gen-7b', run: 'pretrain-v3',
    step: 8412, totalSteps: 50000, eta: '3d 11h',
    throughputPerGpu: 2285, gpuCount: 8, loss: 0.150,
    config: '7B · bf16 · FSDP × 8 × A100', startedAgo: '6d 12h', owner: 'you',
    state: 'active',
    // major: gap is real and growing for ~3,500 steps
    subSignals: { gradNorm: 'ok', lossSpikes: 'ok', throughput: 'ok', evalGap: 'major' },
    reason: 'Eval/train gap diverging since step 4,000'
  },
  {
    id: 'retrieval-encoder/ablation-4', model: 'retrieval-encoder', run: 'ablation-4',
    step: 14200, totalSteps: 20000, eta: '11h',
    throughputPerGpu: 4100, gpuCount: 4, loss: 0.087,
    config: '440M · bf16 · DDP × 4 × H100', startedAgo: '2d 3h', owner: 'you',
    state: 'active',
    subSignals: { gradNorm: 'minor', lossSpikes: 'ok', throughput: 'ok', evalGap: 'ok' },
    reason: 'Gradient norm slightly elevated'
  },
  {
    id: 'vision-base-3b/sft-r2', model: 'vision-base-3b', run: 'sft-r2',
    step: 2840, totalSteps: 8000, eta: '2d 14h',
    throughputPerGpu: 1820, gpuCount: 16, loss: 0.412,
    config: '3B · fp16 · ZeRO-3 × 16', startedAgo: '18h', owner: 'm. chen',
    state: 'active',
    subSignals: { gradNorm: 'ok', lossSpikes: 'ok', throughput: 'ok', evalGap: 'ok' },
    reason: null
  }
];

// Workspaces — multi-tenancy across training orgs/clusters
const workspaces = [
  {
    id: 'anthropic-research',
    name: 'anthropic-research',
    team: 'training-team · staging',
    avatar: 'A',
    gradient: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
    activeRuns: 3,
    role: 'admin'
  },
  {
    id: 'anthropic-prod',
    name: 'anthropic-prod',
    team: 'model-serving · production',
    avatar: 'P',
    gradient: 'linear-gradient(135deg, #f87171, #b91c1c)',
    activeRuns: 1,
    role: 'viewer'
  },
  {
    id: 'experiments',
    name: 'experiments-sandbox',
    team: 'research · personal',
    avatar: 'E',
    gradient: 'linear-gradient(135deg, #06b6d4, #0e7490)',
    activeRuns: 0,
    role: 'admin'
  },
];

// Historical runs for the Runs index page
const historicalRuns = [
  { id: 'vision-base-3b/sft-r1', state: 'failed', step: 3200, totalSteps: 8000, finalLoss: null,
    config: '3B · fp16 · ZeRO-3 × 16', startedAgo: '8h ago', duration: '4h 12m', owner: 'm. chen',
    failureReason: 'NaN loss at step 3,200' },
  { id: 'code-gen-7b/pretrain-v2', state: 'completed', step: 50000, totalSteps: 50000, finalLoss: 0.142,
    config: '7B · bf16 · FSDP × 8 × A100', startedAgo: '12d ago', duration: '6d 4h', owner: 'you',
    failureReason: null },
  { id: 'retrieval-encoder/ablation-3', state: 'completed', step: 20000, totalSteps: 20000, finalLoss: 0.094,
    config: '440M · bf16 · DDP × 4 × H100', startedAgo: '5d ago', duration: '2d 8h', owner: 'you',
    failureReason: null },
  { id: 'retrieval-encoder/ablation-2', state: 'cancelled', step: 8400, totalSteps: 20000, finalLoss: 0.131,
    config: '440M · bf16 · DDP × 4 × H100', startedAgo: '8d ago', duration: '1d 2h', owner: 'you',
    failureReason: 'Cancelled by owner — wrong dataset' },
  { id: 'code-gen-7b/pretrain-v1', state: 'failed', step: 12400, totalSteps: 50000, finalLoss: null,
    config: '7B · bf16 · FSDP × 8 × A100', startedAgo: '20d ago', duration: '2d 18h', owner: 'you',
    failureReason: 'Node failure on rank 3' },
  { id: 'vision-base-1b/sft-r4', state: 'completed', step: 6000, totalSteps: 6000, finalLoss: 0.388,
    config: '1B · fp16 · DDP × 8 · A100', startedAgo: '14d ago', duration: '14h', owner: 'm. chen',
    failureReason: null },
  { id: 'retrieval-encoder/ablation-1', state: 'completed', step: 20000, totalSteps: 20000, finalLoss: 0.156,
    config: '440M · bf16 · DDP × 4 × H100', startedAgo: '11d ago', duration: '2d 6h', owner: 'k. patel',
    failureReason: null },
  { id: 'vision-base-3b/sft-r0', state: 'failed', step: 480, totalSteps: 8000, finalLoss: null,
    config: '3B · fp16 · ZeRO-3 × 16', startedAgo: '15d ago', duration: '52m', owner: 'm. chen',
    failureReason: 'OOM during eval' },
  { id: 'code-gen-3b/baseline', state: 'completed', step: 30000, totalSteps: 30000, finalLoss: 0.198,
    config: '3B · bf16 · FSDP × 8 · A100', startedAgo: '22d ago', duration: '4d 1h', owner: 'k. patel',
    failureReason: null },
];

// Loss curves — gap is now genuinely large (~0.17 by step 8,400)
const trainingSteps = Array.from({ length: 84 }, (_, i) => {
  const step = (i + 1) * 100;
  const base = 0.9 * Math.exp(-step / 3500) + 0.15;
  // Divergence starts step 4,000, accelerates: at step 8,400 gap ≈ 0.17
  const divergenceStart = 4000;
  const divergence = step > divergenceStart
    ? Math.pow((step - divergenceStart) / 4400, 1.4) * 0.12
    : 0;
  return {
    step,
    loss: base + (Math.random() - 0.5) * 0.008,
    evalLoss: base + 0.055 + divergence + (Math.random() - 0.5) * 0.012,
  };
});

// Phase timing history — shows data-load regressed in last 30 steps
const phaseTimingHistory = Array.from({ length: 100 }, (_, i) => {
  const step = 8313 + i;
  const dataDrift = i > 70 ? Math.pow((i - 70) / 30, 1.5) * 4 : 0;
  return {
    step,
    data: 8 + dataDrift + (Math.random() - 0.5) * 0.7,
    forward: 28 + (Math.random() - 0.5) * 1.4,
    backward: 46 + (Math.random() - 0.5) * 1.6,
    optimizer: 3 + (Math.random() - 0.5) * 0.3,
  };
});

const alertStream = [
  { id: 1, severity: 'warning', run: 'retrieval-encoder/ablation-4', step: 14100,
    message: 'Gradient norm elevated', detail: 'Last 80 steps avg 2.1, baseline 0.9. Possible instability.',
    timestamp: '14m ago', resolution: 'Reduce learning rate or enable gradient clipping',
    actions: [{ id: 'reduce-lr', label: 'Reduce LR by 50%', icon: 'wrench' }, { id: 'investigate', label: 'Open run', icon: 'external' }] },
  { id: 2, severity: 'info', run: 'code-gen-7b/pretrain-v3', step: 8000,
    message: 'Checkpoint saved', detail: 'Checkpoint saved to s3://models/code-gen-7b/step-8000',
    timestamp: '42m ago', resolution: null, actions: [] },
  { id: 3, severity: 'critical', run: 'vision-base-3b/sft-r1', step: 3200,
    message: 'NaN loss detected', detail: 'Training crashed at step 3200. Run terminated. Last healthy checkpoint: step 3100.',
    timestamp: '6h ago', resolution: 'Restart from checkpoint step-3100 with lower LR',
    actions: [{ id: 'restart', label: 'Restart from checkpoint', icon: 'rotate' }, { id: 'investigate', label: 'Open run', icon: 'external' }] },
  { id: 4, severity: 'warning', run: 'code-gen-7b/pretrain-v3', step: 7600,
    message: 'Throughput regression', detail: 'Tokens/sec dropped 8% sustained for 30 min. Node health check passed.',
    timestamp: '8h ago', resolution: 'Investigate data pipeline — possible I/O contention',
    actions: [{ id: 'investigate', label: 'Open run', icon: 'external' }] },
  { id: 5, severity: 'info', run: 'vision-base-3b/sft-r2', step: 0,
    message: 'Run started', detail: 'Training run initialized on 16 × H100, distributed ZeRO-3',
    timestamp: '18h ago', resolution: null, actions: [] },
];

// Initial log buffer — live stream appends to this
const initialLogs = [
  { id: 'l-init-7', ts: '14:32:15.234', level: 'error', rank: 0, run: 'retrieval-encoder', msg: 'Gradient norm 2.14 exceeded threshold 1.5 — reducing LR to 1.2e-4' },
  { id: 'l-init-6', ts: '14:32:14.891', level: 'warn',  rank: 0, run: 'retrieval-encoder', msg: 'Feature distribution drift detected: embeddings KL=0.89 vs. epoch baseline' },
  { id: 'l-init-5', ts: '14:32:12.456', level: 'info',  rank: 2, run: 'code-gen-7b',       msg: 'Forward pass completed: batch=64, seq_len=2048, time=28.1ms' },
  { id: 'l-init-4', ts: '14:32:10.123', level: 'info',  rank: 0, run: 'code-gen-7b',       msg: 'Checkpoint health check passed (shard consistency verified)' },
  { id: 'l-init-3', ts: '14:32:08.789', level: 'warn',  rank: 5, run: 'code-gen-7b',       msg: 'GPU 5 utilization 76% (expected ≥85%). Possible straggler.' },
  { id: 'l-init-2', ts: '14:32:05.456', level: 'info',  rank: 0, run: 'vision-base-3b',    msg: 'Learning rate scheduled to 3.6e-4 (cosine schedule, step 2840)' },
  { id: 'l-init-1', ts: '14:32:02.123', level: 'info',  rank: 3, run: 'code-gen-7b',       msg: 'Backward pass completed: gradient reduction 46.2ms, all-reduce 3.1ms' },
  { id: 'l-init-0', ts: '14:31:58.891', level: 'info',  rank: 0, run: 'code-gen-7b',       msg: 'DataLoader prefetch queue: 4/4 batches buffered' },
];

// Pool of templates for live-stream synthesis
const logTemplates = [
  { level: 'info', run: 'code-gen-7b',       msg: () => `Forward pass completed: batch=64, seq_len=2048, time=${(27 + Math.random() * 2).toFixed(1)}ms` },
  { level: 'info', run: 'code-gen-7b',       msg: () => `Backward pass completed: gradient reduction ${(45 + Math.random() * 2).toFixed(1)}ms, all-reduce ${(2.8 + Math.random() * 0.6).toFixed(1)}ms` },
  { level: 'info', run: 'retrieval-encoder', msg: () => `Step ${14200 + Math.floor(Math.random() * 50)}: loss=${(0.085 + Math.random() * 0.01).toFixed(4)}, lr=1.2e-4` },
  { level: 'warn', run: 'code-gen-7b',       msg: () => `GPU ${Math.floor(Math.random() * 8)} utilization ${(72 + Math.random() * 8).toFixed(0)}% (expected ≥85%). Possible straggler.` },
  { level: 'info', run: 'vision-base-3b',    msg: () => `DataLoader prefetch queue: ${Math.floor(Math.random() * 5)}/4 batches buffered` },
  { level: 'info', run: 'code-gen-7b',       msg: () => `All-reduce sync barrier completed in ${(2.9 + Math.random() * 0.4).toFixed(2)}ms` },
  { level: 'warn', run: 'retrieval-encoder', msg: () => `Gradient norm ${(1.9 + Math.random() * 0.3).toFixed(2)} approaching threshold 1.5` },
  { level: 'info', run: 'vision-base-3b',    msg: () => `Step ${2840 + Math.floor(Math.random() * 30)}: loss=${(0.41 + Math.random() * 0.02).toFixed(4)}` },
];

const RANKS = [0, 1, 2, 3, 4, 5, 6, 7];

const generateLogLine = () => {
  const tpl = logTemplates[Math.floor(Math.random() * logTemplates.length)];
  const now = new Date();
  const ts = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}.${String(now.getUTCMilliseconds()).padStart(3, '0')}`;
  return {
    id: `l-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    ts,
    level: tpl.level,
    rank: RANKS[Math.floor(Math.random() * RANKS.length)],
    run: tpl.run,
    msg: tpl.msg(),
  };
};

// KL trend per feature (last 24 hours, hourly)
const klHistory = {
  token_distribution:    Array.from({ length: 24 }, () => 0.10 + Math.random() * 0.05),
  sequence_length:       Array.from({ length: 24 }, () => 0.30 + Math.random() * 0.08),
  batch_class_balance:   Array.from({ length: 24 }, (_, i) => 0.32 + (i / 23) * 0.55 + Math.random() * 0.06),
  attention_mask_density:Array.from({ length: 24 }, () => 0.04 + Math.random() * 0.02),
  vocab_coverage:        Array.from({ length: 24 }, () => 0.16 + Math.random() * 0.04),
  gradient_magnitude:    Array.from({ length: 24 }, (_, i) => i < 18 ? 0.4 + Math.random() * 0.1 : 0.4 + ((i - 17) / 6) * 0.85),
};

const dataIntegrityFeatures = [
  { name: 'token_distribution',     domain: 'input',    kl: 0.12, psi: 0.08, js: 0.06, status: 'ok',       sampleCount: 2_450_000, note: 'Within baseline for current epoch.' },
  { name: 'sequence_length',         domain: 'input',    kl: 0.34, psi: 0.22, js: 0.18, status: 'ok',       sampleCount: 2_450_000, note: 'Mild shift — expected after new shard.' },
  { name: 'batch_class_balance',     domain: 'input',    kl: 0.89, psi: 0.71, js: 0.54, status: 'warning',  sampleCount: 2_450_000, note: 'Class 3 underrepresented this window. Check sampler weights.' },
  { name: 'attention_mask_density',  domain: 'input',    kl: 0.05, psi: 0.03, js: 0.02, status: 'ok',       sampleCount: 2_450_000, note: 'Stable.' },
  { name: 'vocab_coverage',          domain: 'input',    kl: 0.18, psi: 0.14, js: 0.11, status: 'ok',       sampleCount: 2_450_000, note: 'Stable.' },
  { name: 'gradient_magnitude',      domain: 'training', kl: 1.24, psi: 0.98, js: 0.76, status: 'critical', sampleCount: 85_000,    note: 'Matches scheduled LR ramp at step 8,000 — confirm expected.' },
];

// Incidents per hour, by severity (now bars, not areas)
const incidentData = Array.from({ length: 24 }, (_, i) => {
  const bellCurve = Math.exp(-Math.pow((i - 14) / 5, 2));
  return {
    hour: `${i.toString().padStart(2, '0')}:00`,
    critical: Math.max(0, Math.round(bellCurve * 1.2 + (Math.random() - 0.3) * 0.6)),
    warning:  Math.max(0, Math.round(bellCurve * 2.5 + Math.random() * 1.2)),
    info:     Math.max(0, Math.round(1.5 + Math.cos(i / 4) * 1.2 + Math.random())),
  };
});

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ─────────────────────────────────────────────────────────────── */

const designTokens = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  :root {
    --surface-base: #09090b;
    --surface-raised: #0f0f11;
    --surface-overlay: #15151a;
    --surface-hover: #1c1c22;
    --surface-active: #25252d;

    --border-subtle: #1e1e24;
    --border-default: #27272f;
    --border-strong: #34343e;

    --text-primary: #f4f4f5;
    --text-secondary: #a1a1aa;
    --text-tertiary: #71717a;
    --text-disabled: #52525b;

    --brand-300: #c4b5fd;
    --brand-500: #8b5cf6;
    --brand-600: #7c3aed;
    --brand-700: #6d28d9;

    --status-ok: #10b981;
    --status-warn: #f59e0b;
    --status-crit: #ef4444;
    --status-info: #3b82f6;

    --data-2: #06b6d4;

    --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
    --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

    --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;

    --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    --dur-fast: 120ms; --dur-base: 200ms;

    --font-display: 'Geist', -apple-system, sans-serif;
    --font-ui: 'Inter', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;

    --focus-ring: 0 0 0 2px var(--surface-base), 0 0 0 4px var(--brand-500);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body, .mp-root {
    background: var(--surface-base);
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-feature-settings: 'cv11', 'ss01';
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
    min-height: 100vh;
  }

  *:focus { outline: none; }
  *:focus-visible { box-shadow: var(--focus-ring); border-radius: var(--radius-sm); }

  /* ═══════ APP SHELL ═══════ */
  .mp-app { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }

  .mp-sidebar {
    background: var(--surface-raised);
    border-right: 1px solid var(--border-default);
    padding: var(--space-5) var(--space-3);
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .mp-brand {
    padding: 0 var(--space-3) var(--space-5);
    margin-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
  }
  .mp-brand-name {
    font-family: var(--font-display);
    font-size: 20px; font-weight: 600; line-height: 1;
    letter-spacing: -0.03em;
    color: var(--text-primary);
  }
  .mp-brand-dot {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--brand-500);
    margin-left: 2px;
    vertical-align: 0.2em;
  }
  .mp-brand-meta {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-tertiary);
    letter-spacing: 0.1em;
    margin-top: 6px;
    text-transform: uppercase;
  }

  /* Workspace switcher */
  .mp-workspace {
    margin: 0 0 var(--space-4);
    padding: var(--space-3);
    background: var(--surface-overlay);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    transition: border-color var(--dur-base) var(--ease-out);
  }
  .mp-workspace:hover { border-color: var(--border-strong); }
  .mp-workspace-avatar {
    width: 28px; height: 28px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono);
    font-size: 12px; font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .mp-workspace-text {
    display: flex; flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .mp-workspace-name {
    font-size: 12px; font-weight: 600;
    color: var(--text-primary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mp-workspace-team {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
  }

  .mp-nav { display: flex; flex-direction: column; gap: 1px; }
  .mp-nav-item {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    font-size: 13px; font-weight: 500;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: none; background: transparent;
    width: 100%; text-align: left;
    font-family: var(--font-ui);
    position: relative;
    transition: all var(--dur-base) var(--ease-out);
  }
  .mp-nav-item:hover { background: var(--surface-hover); color: var(--text-primary); }
  .mp-nav-item.active { background: var(--surface-hover); color: var(--text-primary); }
  .mp-nav-item.active::before {
    content: '';
    position: absolute;
    left: -11px; top: 50%;
    transform: translateY(-50%);
    width: 2px; height: 16px;
    background: var(--brand-500);
    border-radius: 0 2px 2px 0;
  }
  .mp-nav-icon { width: 14px; height: 14px; color: var(--text-tertiary); flex-shrink: 0; }
  .mp-nav-item.active .mp-nav-icon { color: var(--text-primary); }
  .mp-nav-badge {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 6px;
    background: var(--status-crit);
    color: white;
    border-radius: 4px;
    font-weight: 600;
  }
  .mp-nav-section-label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: var(--space-5) var(--space-3) var(--space-2);
  }

  /* Sidebar footer */
  .mp-sidebar-footer {
    margin-top: auto;
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-subtle);
    display: flex; flex-direction: column;
    gap: 1px;
  }
  .mp-sidebar-user {
    display: flex; align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--dur-base) var(--ease-out);
  }
  .mp-sidebar-user:hover { background: var(--surface-hover); }
  .mp-sidebar-user-avatar {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .mp-sidebar-user-text { flex: 1; min-width: 0; }
  .mp-sidebar-user-name {
    font-size: 12px; font-weight: 500;
    color: var(--text-primary);
  }
  .mp-sidebar-user-role {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-tertiary);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .mp-main { padding: var(--space-8); overflow: hidden; min-width: 0; }

  /* ═══════ PAGE HEADER ═══════ */
  .mp-page-header {
    margin-bottom: var(--space-6);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-5);
  }
  .mp-page-header-text { display: flex; flex-direction: column; gap: var(--space-2); }
  .mp-page-title {
    font-family: var(--font-display);
    font-size: 30px; font-weight: 500; line-height: 1;
    letter-spacing: -0.03em;
    color: var(--text-primary);
  }
  .mp-page-sub { font-size: 13px; color: var(--text-secondary); }

  /* Time / freshness disclosure */
  .mp-meta-strip {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .mp-meta-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px var(--space-3);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: 100px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .mp-meta-chip.live { color: var(--status-ok); border-color: rgba(16, 185, 129, 0.25); }
  .mp-meta-chip.live .mp-meta-pulse {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--status-ok);
    animation: pulse-soft 2s ease-in-out infinite;
  }
  .mp-meta-chip.stale { color: var(--status-warn); border-color: rgba(245, 158, 11, 0.25); }
  .mp-meta-chip.disconnected { color: var(--status-crit); border-color: rgba(239, 68, 68, 0.25); }

  /* ═══════ PANEL ═══════ */
  .mp-panel {
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-4);
  }
  .mp-panel.hero { padding: var(--space-8); }
  .mp-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-5);
    gap: var(--space-5);
  }
  .mp-panel-title-block { display: flex; flex-direction: column; gap: 2px; }
  .mp-panel-title {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 500; line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }
  .mp-panel-desc { font-size: 12px; color: var(--text-secondary); }

  /* ═══════ STAT CELL ═══════ */
  .mp-stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  .mp-stat-cell {
    padding: var(--space-5);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    display: flex; flex-direction: column; gap: var(--space-2);
    transition: border-color var(--dur-base) var(--ease-out);
  }
  .mp-stat-cell:hover { border-color: var(--border-strong); }
  .mp-stat-lbl {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    display: flex; align-items: center; gap: var(--space-2);
  }
  .mp-stat-val {
    font-family: var(--font-mono);
    font-size: 28px; font-weight: 500; line-height: 1;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .mp-stat-val .unit { font-size: 16px; color: var(--text-tertiary); margin-left: 2px; font-weight: 400; }
  .mp-stat-detail {
    font-family: var(--font-mono);
    font-size: 10px; color: var(--text-tertiary); line-height: 1.5;
  }
  .mp-stat-delta { font-family: var(--font-mono); font-size: 11px; font-weight: 500; }
  .mp-stat-delta.up { color: var(--status-ok); }
  .mp-stat-delta.down { color: var(--status-crit); }
  .mp-stat-delta.neutral { color: var(--text-tertiary); }

  /* Skeleton */
  .mp-skeleton {
    background: linear-gradient(90deg, var(--surface-active) 0%, var(--surface-hover) 50%, var(--surface-active) 100%);
    background-size: 200% 100%;
    border-radius: var(--radius-sm);
    animation: shimmer 1.4s ease-in-out infinite;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ═══════ HEALTH PILL ═══════ */
  .mp-health-pill {
    display: inline-flex; align-items: center;
    gap: var(--space-2);
    padding: 5px 10px 5px 8px;
    border-radius: 100px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .mp-health-pill.healthy { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); color: var(--status-ok); }
  .mp-health-pill.attention { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); color: var(--status-warn); }
  .mp-health-pill.critical { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--status-crit); }
  .mp-health-pill.completed { background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); color: var(--status-info); }
  .mp-health-pill.failed { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--status-crit); }
  .mp-health-pill.cancelled { background: var(--surface-overlay); border: 1px solid var(--border-default); color: var(--text-tertiary); }
  .mp-health-pill-icon { width: 12px; height: 12px; flex-shrink: 0; }
  .mp-health-pill.healthy .mp-health-pill-icon { animation: pulse-soft 3s ease-in-out infinite; }
  .mp-health-pill.critical .mp-health-pill-icon { animation: pulse-soft 1.2s ease-in-out infinite; }
  @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

  /* ═══════ RUN STRIP ═══════ */
  .mp-run-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-5) var(--space-6);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-5);
    gap: var(--space-6);
  }
  .mp-run-strip-left { display: flex; align-items: center; gap: var(--space-5); }
  .mp-run-name-block { display: flex; flex-direction: column; gap: 2px; }
  .mp-run-name {
    font-family: var(--font-mono);
    font-size: 14px; font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }
  .mp-run-config { font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary); }
  .mp-run-reason {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--status-warn);
    margin-top: 4px;
    display: flex; align-items: center; gap: 6px;
  }
  .mp-run-strip-right { display: flex; gap: var(--space-8); }
  .mp-run-strip-stat { display: flex; flex-direction: column; gap: var(--space-2); }
  .mp-run-strip-stat-val {
    font-family: var(--font-mono);
    font-size: 14px; font-weight: 500;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .mp-run-strip-stat-secondary {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    margin-top: 2px;
  }

  /* ═══════ STEP ANATOMY ═══════ */
  .mp-anatomy-bar {
    display: flex;
    height: 60px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    margin-bottom: var(--space-3);
  }
  .mp-anatomy-seg {
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    padding: var(--space-2);
    transition: filter var(--dur-base) var(--ease-out);
    cursor: pointer;
    min-width: 40px;
  }
  .mp-anatomy-seg:hover { filter: brightness(1.15); }
  .mp-anatomy-seg.data { background: #3f3f46; }
  .mp-anatomy-seg.fwd  { background: var(--brand-700); }
  .mp-anatomy-seg.bwd  { background: var(--brand-500); }
  .mp-anatomy-seg.opt  { background: var(--data-2); }
  .mp-aseg-lbl {
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .mp-aseg-val {
    font-family: var(--font-mono);
    font-size: 12px; font-weight: 600;
    color: #fff; margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }
  .mp-anatomy-ticks { position: relative; height: 18px; margin-bottom: var(--space-5); }
  .mp-anatomy-tick {
    position: absolute; top: 0;
    display: flex; flex-direction: column; align-items: center;
    transform: translateX(-50%);
  }
  .mp-anatomy-tick-mark { width: 1px; height: 4px; background: var(--border-strong); }
  .mp-anatomy-tick-lbl {
    font-family: var(--font-mono);
    font-size: 10px; color: var(--text-tertiary);
    margin-top: 2px; font-variant-numeric: tabular-nums;
  }
  .mp-anatomy-legend {
    display: flex; flex-wrap: wrap; gap: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-subtle);
  }
  .mp-alegend-item { display: flex; align-items: center; gap: var(--space-2); }
  .mp-alegend-dot { width: 8px; height: 8px; border-radius: 2px; }
  .mp-alegend-dot.data { background: #3f3f46; }
  .mp-alegend-dot.fwd { background: var(--brand-700); }
  .mp-alegend-dot.bwd { background: var(--brand-500); }
  .mp-alegend-dot.opt { background: var(--data-2); }
  .mp-alegend-name { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
  .mp-alegend-pct {
    font-family: var(--font-mono);
    font-size: 11px; color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  /* ═══════ CHART WRAP ═══════ */
  .mp-chart-wrap {
    background: var(--surface-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-5);
    margin-bottom: var(--space-3);
  }
  .mp-chart-legend {
    display: flex; align-items: center;
    gap: var(--space-5);
    flex-wrap: wrap;
  }
  .mp-chart-legend-chip {
    display: inline-flex; align-items: center; gap: var(--space-2);
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary); font-weight: 500;
  }
  .mp-chart-legend-line { width: 16px; height: 2px; border-radius: 1px; }
  .mp-chart-legend-line.solid { background: var(--brand-500); }
  .mp-chart-legend-line.dashed { background: repeating-linear-gradient(90deg, var(--data-2) 0 4px, transparent 4px 8px); }
  .mp-chart-legend-line.ok { background: var(--status-ok); }
  .mp-chart-legend-line.warn { background: var(--status-warn); }
  .mp-chart-legend-line.crit { background: var(--status-crit); }
  .mp-chart-legend-line.info-color { background: var(--status-info); }
  .mp-chart-legend-line.data-clr { background: #71717a; }
  .mp-chart-legend-line.fwd-clr { background: var(--brand-700); }
  .mp-chart-legend-line.bwd-clr { background: var(--brand-500); }
  .mp-chart-legend-line.opt-clr { background: var(--data-2); }
  .mp-chart-legend-val {
    font-family: var(--font-mono);
    font-size: 11px; font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .mp-chart-legend-delta {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 11px; color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .mp-tip {
    background: var(--surface-overlay);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    padding: var(--space-3) var(--space-4);
    font-family: var(--font-mono);
    font-size: 11px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    min-width: 140px;
  }
  .mp-tip-ts {
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .mp-tip-row {
    display: flex; justify-content: space-between; gap: var(--space-4);
    align-items: baseline; padding: 2px 0;
  }
  .mp-tip-name { color: var(--text-secondary); display: inline-flex; align-items: center; gap: 6px; }
  .mp-tip-dot { width: 8px; height: 8px; border-radius: 2px; }
  .mp-tip-val {
    color: var(--text-primary); font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  /* ═══════ HEALTH GRID ═══════ */
  .mp-health-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
  }
  .mp-health-cell {
    padding: var(--space-5);
    background: var(--surface-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    display: flex; flex-direction: column; gap: var(--space-2);
    position: relative;
  }
  .mp-health-cell::before {
    content: ''; position: absolute;
    left: 0; top: 16px; bottom: 16px;
    width: 2px; border-radius: 0 2px 2px 0;
  }
  .mp-health-cell.ok::before { background: var(--status-ok); }
  .mp-health-cell.warn::before { background: var(--status-warn); }
  .mp-health-cell.crit::before { background: var(--status-crit); }

  /* ═══════ RUN ROW ═══════ */
  .mp-run-row {
    display: grid;
    grid-template-columns: auto 2fr 1fr 1fr 1fr auto;
    align-items: center;
    padding: var(--space-4) var(--space-5);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-2);
    gap: var(--space-5);
    cursor: pointer;
    transition: border-color var(--dur-base) var(--ease-out);
  }
  .mp-run-row:hover { border-color: var(--border-strong); }
  .mp-run-row-name { display: flex; flex-direction: column; gap: 2px; }
  .mp-run-row-title { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .mp-run-row-config { font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); }
  .mp-run-row-progress { display: flex; flex-direction: column; gap: 4px; }
  .mp-run-row-progress-bar { height: 3px; background: var(--surface-active); border-radius: 2px; overflow: hidden; }
  .mp-run-row-progress-fill { height: 100%; background: var(--brand-500); border-radius: 2px; }
  .mp-run-row-progress-fill.failed { background: var(--status-crit); }
  .mp-run-row-progress-fill.cancelled { background: var(--text-disabled); }
  .mp-run-row-progress-fill.completed { background: var(--status-info); }
  .mp-run-row-stat {
    font-family: var(--font-mono);
    font-size: 11px; color: var(--text-secondary);
    display: flex; flex-direction: column; gap: 1px;
  }
  .mp-run-row-stat-val { color: var(--text-primary); font-weight: 600; font-variant-numeric: tabular-nums; }

  /* ═══════ ALERT ROW ═══════ */
  .mp-alert-row {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: flex-start;
    gap: var(--space-5);
    padding: var(--space-5);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-left: 3px solid var(--border-default);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-2);
  }
  .mp-alert-row.critical { border-left-color: var(--status-crit); }
  .mp-alert-row.warning { border-left-color: var(--status-warn); }
  .mp-alert-row.info { border-left-color: var(--status-info); }
  .mp-alert-icon {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .mp-alert-row.critical .mp-alert-icon { background: rgba(239, 68, 68, 0.1); color: var(--status-crit); }
  .mp-alert-row.warning .mp-alert-icon { background: rgba(245, 158, 11, 0.1); color: var(--status-warn); }
  .mp-alert-row.info .mp-alert-icon { background: rgba(59, 130, 246, 0.1); color: var(--status-info); }
  .mp-alert-body { display: flex; flex-direction: column; gap: 4px; }
  .mp-alert-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
  .mp-alert-detail { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
  .mp-alert-resolution {
    margin-top: var(--space-2);
    padding: var(--space-3);
    background: var(--surface-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--text-secondary);
    display: flex; flex-direction: column; gap: var(--space-3);
  }
  .mp-alert-resolution-text { display: flex; gap: var(--space-2); align-items: flex-start; }
  .mp-alert-resolution-text strong {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    flex-shrink: 0;
    min-width: 56px;
    margin-top: 2px;
  }
  .mp-alert-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .mp-alert-meta {
    display: flex; flex-direction: column; align-items: flex-end;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 10px; color: var(--text-tertiary);
    white-space: nowrap;
  }
  .mp-alert-meta-run { color: var(--text-secondary); font-weight: 600; }

  /* Empty state */
  .mp-empty {
    padding: var(--space-10) var(--space-5);
    text-align: center;
    background: var(--surface-raised);
    border: 1px dashed var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
    font-size: 13px;
  }
  .mp-empty-mono { font-family: var(--font-mono); font-size: 11px; margin-top: 4px; }

  /* ═══════ LOG STREAM ═══════ */
  .mp-log-toolbar {
    display: flex; align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
  }
  .mp-log-toolbar-spacer { flex: 1; }
  .mp-log-stream {
    background: var(--surface-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: 12px;
    max-height: 560px;
    overflow-y: auto;
    position: relative;
  }
  .mp-log-stream-header,
  .mp-log-row {
    display: grid;
    grid-template-columns: 100px 50px 40px 140px 1fr;
    padding: 7px var(--space-4);
    gap: var(--space-3);
    align-items: baseline;
    border-bottom: 1px solid var(--border-subtle);
  }
  .mp-log-stream-header {
    background: var(--surface-base);
    border-bottom: 1px solid var(--border-default);
    position: sticky; top: 0; z-index: 1;
    font-size: 10px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  .mp-log-row {
    color: var(--text-secondary);
    transition: background var(--dur-fast) var(--ease-out);
  }
  .mp-log-row:hover { background: var(--surface-hover); }
  .mp-log-row:last-child { border-bottom: none; }
  .mp-log-row.fresh {
    animation: log-flash var(--dur-base) var(--ease-out);
  }
  @keyframes log-flash {
    0% { background: rgba(139, 92, 246, 0.15); }
    100% { background: transparent; }
  }
  .mp-log-ts { color: var(--text-tertiary); font-size: 11px; }
  .mp-log-level {
    text-align: center;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.05em;
    padding: 2px 4px;
    border-radius: 3px;
  }
  .mp-log-level.info { color: var(--text-tertiary); }
  .mp-log-level.warn { color: var(--status-warn); background: rgba(245, 158, 11, 0.08); }
  .mp-log-level.error { color: var(--status-crit); background: rgba(239, 68, 68, 0.08); }
  .mp-log-rank { color: var(--text-tertiary); font-size: 11px; }
  .mp-log-run { color: var(--text-primary); font-weight: 500; font-size: 11px; }
  .mp-log-msg { color: var(--text-secondary); font-size: 12px; line-height: 1.5; }

  /* ═══════ FEATURE TABLE ═══════ */
  .mp-feature-table {
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .mp-feature-table-header,
  .mp-feature-row-head {
    display: grid;
    grid-template-columns: 2fr 1fr 1.2fr 90px 1fr auto auto;
    align-items: center;
    padding: var(--space-4) var(--space-5);
    gap: var(--space-4);
  }
  .mp-feature-table-header {
    background: var(--surface-base);
    border-bottom: 1px solid var(--border-default);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
  }
  .mp-feature-row { border-bottom: 1px solid var(--border-subtle); }
  .mp-feature-row:last-child { border-bottom: none; }
  .mp-feature-row-head { cursor: pointer; transition: background var(--dur-fast) var(--ease-out); }
  .mp-feature-row-head:hover { background: var(--surface-hover); }
  .mp-feature-row-expand {
    padding: var(--space-4) var(--space-5) var(--space-5) calc(var(--space-5) + var(--space-4));
    background: var(--surface-base);
    border-top: 1px solid var(--border-subtle);
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-5);
  }
  .mp-feature-expand-item { display: flex; flex-direction: column; gap: 4px; }
  .mp-feature-expand-lbl {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .mp-feature-expand-val {
    font-family: var(--font-mono);
    font-size: 14px; font-weight: 500;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .mp-feature-expand-note {
    font-size: 12px; color: var(--text-secondary);
    line-height: 1.5;
    grid-column: 1 / -1;
    margin-top: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-subtle);
  }
  .mp-feature-name { font-family: var(--font-mono); font-size: 13px; color: var(--text-primary); font-weight: 500; }
  .mp-feature-domain {
    font-family: var(--font-mono);
    font-size: 10px; color: var(--text-tertiary);
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .mp-feature-kl-cell {
    display: flex; align-items: center; gap: var(--space-3);
  }
  .mp-feature-kl-bar {
    flex: 1;
    height: 4px;
    background: var(--surface-active);
    border-radius: 2px;
    overflow: hidden;
  }
  .mp-feature-kl-fill {
    height: 100%; border-radius: 2px;
    transition: width var(--dur-base) var(--ease-out);
  }
  .mp-feature-kl-fill.ok { background: var(--status-ok); }
  .mp-feature-kl-fill.warn { background: var(--status-warn); }
  .mp-feature-kl-fill.crit { background: var(--status-crit); }
  .mp-feature-stat {
    font-family: var(--font-mono);
    font-size: 13px; color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    min-width: 42px;
    text-align: right;
  }
  .mp-feature-stat.high { color: var(--status-warn); }
  .mp-feature-stat.critical { color: var(--status-crit); }
  .mp-feature-status { width: 8px; height: 8px; border-radius: 50%; }
  .mp-feature-status.ok { background: var(--status-ok); }
  .mp-feature-status.warning { background: var(--status-warn); }
  .mp-feature-status.critical { background: var(--status-crit); }
  .mp-feature-chevron {
    color: var(--text-tertiary);
    transition: transform var(--dur-base) var(--ease-out);
  }
  .mp-feature-chevron.open { transform: rotate(90deg); }
  .mp-feature-spark { height: 24px; }

  /* ═══════ BUTTONS ═══════ */
  .mp-btn {
    display: inline-flex; align-items: center; gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--surface-hover);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-size: 12px; font-weight: 500;
    cursor: pointer;
    transition: all var(--dur-base) var(--ease-out);
  }
  .mp-btn:hover { background: var(--surface-active); border-color: var(--border-strong); }
  .mp-btn.ghost { background: transparent; }
  .mp-btn.sm { padding: 5px var(--space-3); font-size: 11px; }
  .mp-btn.success-flash {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.4);
    color: var(--status-ok);
  }

  /* ═══════ FILTER BAR ═══════ */
  .mp-filter-bar {
    display: flex; gap: var(--space-2);
    margin-bottom: var(--space-4);
    align-items: center;
    flex-wrap: wrap;
  }
  .mp-filter-input {
    flex: 1;
    min-width: 240px;
    display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: 11px;
    transition: border-color var(--dur-base) var(--ease-out);
  }
  .mp-filter-input:focus-within { border-color: var(--brand-500); box-shadow: none; }
  .mp-filter-input input {
    background: transparent; border: none; outline: none;
    color: var(--text-primary);
    font-family: inherit; font-size: inherit;
    flex: 1;
    min-width: 0;
  }
  .mp-filter-input input::placeholder { color: var(--text-tertiary); }
  .mp-filter-count {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .mp-filter-group {
    display: flex; gap: 2px;
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 2px;
  }
  .mp-filter-chip {
    padding: 4px var(--space-3);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-tertiary);
    cursor: pointer;
    border: none; background: transparent;
    transition: all var(--dur-fast) var(--ease-out);
    white-space: nowrap;
  }
  .mp-filter-chip.active { background: var(--surface-hover); color: var(--text-primary); }

  /* ═══════ INSIGHT ROW ═══════ */
  .mp-insight-row {
    display: flex; align-items: center; gap: var(--space-3);
    font-size: 13px; color: var(--text-secondary);
    margin-top: var(--space-3);
  }
  .mp-insight-icon.ok { color: var(--status-ok); }
  .mp-insight-icon.warn { color: var(--status-warn); }
  .mp-insight-icon.crit { color: var(--status-crit); }

  /* Phase tabs */
  .mp-phase-tabs {
    display: flex; gap: 2px;
    background: var(--surface-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 2px; margin-bottom: var(--space-4);
    width: fit-content;
  }
  .mp-phase-tab {
    padding: 6px 14px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
    cursor: pointer;
    transition: all var(--dur-fast) var(--ease-out);
  }
  .mp-phase-tab.active { background: var(--surface-hover); color: var(--text-primary); }
  .mp-phase-card {
    padding: var(--space-4);
    background: var(--surface-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
  }
  .mp-phase-card-lbl {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--brand-300);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
  }
  .mp-phase-card-val {
    font-family: var(--font-mono);
    font-size: 20px; font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 12px;
    font-variant-numeric: tabular-nums;
  }
  .mp-phase-card-note {
    font-size: 11px; color: var(--text-secondary); line-height: 1.6;
    font-family: var(--font-mono);
  }

  /* Toast */
  .mp-toast {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    background: var(--surface-overlay);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    display: flex; align-items: center; gap: var(--space-3);
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    z-index: 100;
    font-size: 12px;
    color: var(--text-primary);
    animation: toast-in 200ms var(--ease-out);
    max-width: 360px;
  }
  .mp-toast-icon { color: var(--status-ok); flex-shrink: 0; }
  @keyframes toast-in {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* ═══════ WORKSPACE POPOVER ═══════ */
  .mp-ws-host { position: relative; margin: 0 0 var(--space-4); }
  .mp-ws-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--surface-overlay);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    padding: 6px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02);
    z-index: 50;
    animation: ws-pop 160ms var(--ease-out);
  }
  @keyframes ws-pop {
    from { transform: translateY(-4px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .mp-ws-popover-label {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-tertiary);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: var(--space-2) var(--space-3) var(--space-1);
  }
  .mp-ws-item {
    display: flex; align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: none;
    background: transparent;
    width: 100%;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out);
    text-align: left;
  }
  .mp-ws-item:hover { background: var(--surface-hover); }
  .mp-ws-item-avatar {
    width: 26px; height: 26px;
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono);
    font-size: 11px; font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .mp-ws-item-text { flex: 1; min-width: 0; }
  .mp-ws-item-name {
    font-size: 12px; font-weight: 600;
    color: var(--text-primary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mp-ws-item-team {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-tertiary);
    letter-spacing: 0.04em;
  }
  .mp-ws-item-runs {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-tertiary);
    padding: 2px 6px;
    background: var(--surface-active);
    border-radius: 4px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .mp-ws-item-check { color: var(--brand-500); flex-shrink: 0; }
  .mp-ws-divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 4px 0;
  }
  .mp-ws-item.muted .mp-ws-item-name { color: var(--text-secondary); font-weight: 500; }

  /* ═══════ SETTINGS ═══════ */
  .mp-settings-shell {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: var(--space-6);
    align-items: flex-start;
  }
  .mp-settings-nav {
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-3);
    position: sticky;
    top: var(--space-8);
  }
  .mp-settings-nav-item {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: none;
    background: transparent;
    width: 100%;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-secondary);
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    transition: all var(--dur-fast) var(--ease-out);
  }
  .mp-settings-nav-item:hover { background: var(--surface-hover); color: var(--text-primary); }
  .mp-settings-nav-item.active { background: var(--surface-hover); color: var(--text-primary); }

  .mp-settings-section { display: flex; flex-direction: column; gap: var(--space-4); }
  .mp-form-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-4) 0;
    border-bottom: 1px solid var(--border-subtle);
  }
  .mp-form-row:last-child { border-bottom: none; }
  .mp-form-label-block { display: flex; flex-direction: column; gap: 4px; }
  .mp-form-label {
    font-size: 13px; font-weight: 500;
    color: var(--text-primary);
  }
  .mp-form-help {
    font-size: 12px; color: var(--text-secondary);
    line-height: 1.5;
  }

  /* Toggle */
  .mp-toggle {
    width: 36px; height: 20px;
    background: var(--surface-active);
    border: 1px solid var(--border-default);
    border-radius: 100px;
    position: relative;
    cursor: pointer;
    transition: all var(--dur-base) var(--ease-out);
    flex-shrink: 0;
    padding: 0;
  }
  .mp-toggle::after {
    content: '';
    position: absolute;
    top: 1px; left: 1px;
    width: 16px; height: 16px;
    background: var(--text-secondary);
    border-radius: 50%;
    transition: all var(--dur-base) var(--ease-out);
  }
  .mp-toggle.on {
    background: var(--brand-500);
    border-color: var(--brand-500);
  }
  .mp-toggle.on::after {
    left: 17px;
    background: white;
  }

  /* Segmented control */
  .mp-seg {
    display: flex; gap: 2px;
    background: var(--surface-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 2px;
    flex-shrink: 0;
  }
  .mp-seg-btn {
    padding: 5px 12px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
    cursor: pointer;
    transition: all var(--dur-fast) var(--ease-out);
    white-space: nowrap;
  }
  .mp-seg-btn.active { background: var(--surface-hover); color: var(--text-primary); }

  /* Select */
  .mp-select {
    background: var(--surface-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 6px var(--space-3);
    cursor: pointer;
    min-width: 140px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23a1a1aa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }
  .mp-select:focus { outline: none; border-color: var(--brand-500); }

  /* Text input */
  .mp-text-input {
    background: var(--surface-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 6px var(--space-3);
    min-width: 200px;
  }
  .mp-text-input:focus { outline: none; border-color: var(--brand-500); }
  .mp-text-input::placeholder { color: var(--text-tertiary); }

  /* Notification routing matrix */
  .mp-routing-table {
    background: var(--surface-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-top: var(--space-3);
  }
  .mp-routing-header,
  .mp-routing-row {
    display: grid;
    grid-template-columns: 120px repeat(3, 1fr);
    align-items: center;
    padding: var(--space-3) var(--space-4);
    gap: var(--space-3);
  }
  .mp-routing-header {
    background: var(--surface-overlay);
    border-bottom: 1px solid var(--border-default);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
  }
  .mp-routing-row {
    border-bottom: 1px solid var(--border-subtle);
  }
  .mp-routing-row:last-child { border-bottom: none; }
  .mp-routing-severity {
    display: flex; align-items: center; gap: var(--space-2);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
  }
  .mp-routing-severity.critical { color: var(--status-crit); }
  .mp-routing-severity.warning  { color: var(--status-warn); }
  .mp-routing-severity.info     { color: var(--status-info); }
  .mp-routing-cell {
    display: flex; align-items: center; gap: var(--space-2);
  }

  /* Integration card */
  .mp-int-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
    margin-top: var(--space-3);
  }
  .mp-int-card {
    padding: var(--space-4);
    background: var(--surface-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .mp-int-head {
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .mp-int-name {
    font-size: 14px; font-weight: 600; color: var(--text-primary);
  }
  .mp-int-meta {
    font-family: var(--font-mono);
    font-size: 11px; color: var(--text-tertiary);
    margin-top: 2px;
  }
  .mp-int-status {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  .mp-int-status.connected { background: rgba(16, 185, 129, 0.1); color: var(--status-ok); border: 1px solid rgba(16, 185, 129, 0.25); }
  .mp-int-status.disconnected { background: var(--surface-overlay); color: var(--text-tertiary); border: 1px solid var(--border-default); }

  /* API token table */
  .mp-token-table {
    background: var(--surface-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-top: var(--space-3);
  }
  .mp-token-header,
  .mp-token-row {
    display: grid;
    grid-template-columns: 1.2fr 100px 100px 100px auto;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    gap: var(--space-4);
  }
  .mp-token-header {
    background: var(--surface-overlay);
    border-bottom: 1px solid var(--border-default);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
  }
  .mp-token-row { border-bottom: 1px solid var(--border-subtle); }
  .mp-token-row:last-child { border-bottom: none; }
  .mp-token-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-primary);
    font-weight: 500;
  }
  .mp-token-secret {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-tertiary);
    margin-top: 2px;
    letter-spacing: 0.05em;
  }
  .mp-token-meta {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
  }
  .mp-token-perm {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 6px;
    background: var(--surface-overlay);
    border: 1px solid var(--border-default);
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    width: fit-content;
  }
  .mp-token-perm.write { color: var(--brand-300); border-color: rgba(196, 181, 253, 0.25); }
  .mp-btn.danger {
    background: transparent;
    color: var(--status-crit);
    border-color: rgba(239, 68, 68, 0.3);
  }
  .mp-btn.danger:hover { background: rgba(239, 68, 68, 0.08); }

  /* Settings panel */
  .mp-settings-panel-title {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 500; line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  .mp-settings-panel-desc {
    font-size: 12px; color: var(--text-secondary);
    margin-bottom: var(--space-5);
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
`;

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVES
   ─────────────────────────────────────────────────────────────── */

const HealthPill = ({ status, label = null }) => {
  const Icon =
    status === 'healthy' || status === 'completed' ? CheckCircle2
    : status === 'attention' ? AlertTriangle
    : status === 'cancelled' ? XCircle
    : XCircle;
  const defaultLabel =
    status === 'healthy' ? 'HEALTHY'
    : status === 'attention' ? 'ATTENTION'
    : status === 'critical' ? 'CRITICAL'
    : status === 'completed' ? 'COMPLETED'
    : status === 'failed' ? 'FAILED'
    : status === 'cancelled' ? 'CANCELLED'
    : 'UNKNOWN';
  return (
    <span className={`mp-health-pill ${status}`}>
      <Icon className="mp-health-pill-icon" strokeWidth={2.5} />
      {label || defaultLabel}
    </span>
  );
};

const StatCell = ({ label, value, unit = null, detail = null, delta = null, deltaDir = null, loading = false }) => (
  <div className="mp-stat-cell">
    <span className="mp-stat-lbl">{label}</span>
    {loading ? (
      <div className="mp-skeleton" style={{ height: 28, width: '60%' }} />
    ) : (
      <span className="mp-stat-val">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </span>
    )}
    {!loading && (detail || delta) && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        {detail && <span className="mp-stat-detail">{detail}</span>}
        {delta && <span className={`mp-stat-delta ${deltaDir || 'neutral'}`}>{delta}</span>}
      </div>
    )}
  </div>
);

const PageHeader = ({ title, subtitle = null, meta = null }) => (
  <div className="mp-page-header">
    <div className="mp-page-header-text">
      <h1 className="mp-page-title">{title}</h1>
      {subtitle && <p className="mp-page-sub">{subtitle}</p>}
    </div>
    {meta && <div className="mp-meta-strip">{meta}</div>}
  </div>
);

const Panel = ({ title = null, description = null, action = null, hero = false, children }) => (
  <div className={`mp-panel ${hero ? 'hero' : ''}`}>
    {(title || description || action) && (
      <div className="mp-panel-header">
        <div className="mp-panel-title-block">
          {title && <h2 className="mp-panel-title">{title}</h2>}
          {description && <p className="mp-panel-desc">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const RunStripStat = ({ label, value, secondary = null }) => (
  <div className="mp-run-strip-stat">
    <span className="mp-stat-lbl">{label}</span>
    <span className="mp-run-strip-stat-val">{value}</span>
    {secondary && <span className="mp-run-strip-stat-secondary">{secondary}</span>}
  </div>
);

const formatNum = (v, digits = 4) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return typeof v === 'number' ? v.toFixed(digits) : v;
};

const ChartTooltip = ({ active, payload, label, formatter, xLabel = 'step' }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="mp-tip">
      <div className="mp-tip-ts">{xLabel} {typeof label === 'number' ? label.toLocaleString() : label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="mp-tip-row">
          <span className="mp-tip-name">
            <span className="mp-tip-dot" style={{ background: entry.color || entry.stroke || entry.fill }} />
            {entry.name || entry.dataKey}
          </span>
          <span className="mp-tip-val">
            {formatter
              ? formatter(entry.value, entry.dataKey)
              : (entry.value === null || entry.value === undefined ? '—' : entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Inline sparkline for KL trend
const Sparkline = ({ data, color, threshold = null }) => {
  const chartData = useMemo(() => data.map((v, i) => ({ i, v })), [data]);
  return (
    <div className="mp-feature-spark">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <YAxis hide domain={[0, Math.max(1.5, Math.max(...data) * 1.1)]} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ActionIcon = ({ name, size = 12 }) => {
  if (name === 'wrench') return <Wrench size={size} />;
  if (name === 'rotate') return <RotateCw size={size} />;
  if (name === 'external') return <ExternalLink size={size} />;
  return null;
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: OVERVIEW
   ─────────────────────────────────────────────────────────────── */

const OverviewPage = ({ onToast }) => {
  // Simulated initial loading on the throughput card
  const [loadingThroughput, setLoadingThroughput] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoadingThroughput(false), 700);
    return () => clearTimeout(t);
  }, []);

  const totalGpus = activeRuns.reduce((s, r) => s + r.gpuCount, 0);
  const totalThroughput = activeRuns.reduce(
    (s, r) => s + r.throughputPerGpu * r.gpuCount, 0
  );

  const totalIncidents = incidentData.reduce(
    (s, d) => s + d.critical + d.warning + d.info, 0
  );
  const peakHour = incidentData.reduce(
    (best, d, i) => {
      const total = d.critical + d.warning + d.info;
      return total > best.total ? { total, i } : best;
    },
    { total: 0, i: 0 }
  );

  const hasRuns = activeRuns.length > 0;

  const meta = (
    <>
      <span className="mp-meta-chip live"><span className="mp-meta-pulse" />Live</span>
      <span className="mp-meta-chip"><Globe2 size={10} />UTC</span>
    </>
  );

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Fleet-wide observability across all active runs"
        meta={meta}
      />

      <div className="mp-stat-row">
        <StatCell label="Active runs" value={activeRuns.length} detail="2 yours, 1 team" delta="+1" deltaDir="up" />
        <StatCell
          label="Cluster throughput"
          value={(totalThroughput / 1000).toFixed(1)} unit="k tok/s"
          detail={`Across ${totalGpus} GPUs · ${activeRuns.length} runs`}
          delta="+3.2%" deltaDir="up"
          loading={loadingThroughput}
        />
        <StatCell label="Open alerts" value="2" detail="1 warning, 1 critical" delta="-1" deltaDir="up" />
        <StatCell label="Uptime · 30d" value="99.8" unit="%" detail="87m downtime · last incident 8d ago" />
      </div>

      <Panel title="Active runs" description="Training runs currently in progress">
        {hasRuns ? activeRuns.map(run => {
          const progressPct = (run.step / run.totalSteps) * 100;
          const status = deriveStatus(run.subSignals);
          return (
            <div key={run.id} className="mp-run-row" tabIndex={0} role="button">
              <HealthPill status={status} />
              <div className="mp-run-row-name">
                <span className="mp-run-row-title">{run.id}</span>
                <span className="mp-run-row-config">{run.config}</span>
              </div>
              <div className="mp-run-row-progress">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  <span>{run.step.toLocaleString()}</span>
                  <span>{progressPct.toFixed(0)}%</span>
                </div>
                <div className="mp-run-row-progress-bar">
                  <div className="mp-run-row-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <div className="mp-run-row-stat">
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loss</span>
                <span className="mp-run-row-stat-val">{run.loss.toFixed(3)}</span>
              </div>
              <div className="mp-run-row-stat">
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ETA</span>
                <span className="mp-run-row-stat-val">{run.eta}</span>
              </div>
              <ChevronRight size={14} color="var(--text-tertiary)" />
            </div>
          );
        }) : (
          <div className="mp-empty">
            No runs are currently active.
            <div className="mp-empty-mono">Launch a training run to see it here.</div>
          </div>
        )}
      </Panel>

      <Panel title="Incidents · last 24 hours" description="Alert count per hour, by severity">
        <div className="mp-chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incidentData} margin={{ top: 12, right: 16, bottom: 28, left: 16 }}>
              <CartesianGrid stroke="#1e1e24" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#71717a' }}
                tickLine={false}
                axisLine={{ stroke: '#27272f' }}
                interval={3}
                label={{ value: 'HOUR (UTC)', position: 'insideBottom', offset: -14, fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}
              />
              <YAxis
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#71717a' }}
                tickLine={false}
                axisLine={{ stroke: '#27272f' }}
                label={{ value: 'COUNT', angle: -90, position: 'insideLeft', offset: 10, fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}
              />
              <Tooltip
                content={<ChartTooltip xLabel="hour" />}
                cursor={{ fill: 'rgba(139, 92, 246, 0.06)' }}
              />
              <Bar dataKey="info"     name="Info"     stackId="s" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="warning"  name="Warning"  stackId="s" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="critical" name="Critical" stackId="s" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mp-chart-legend">
          <span className="mp-chart-legend-chip"><span className="mp-chart-legend-line crit" />Critical</span>
          <span className="mp-chart-legend-chip"><span className="mp-chart-legend-line warn" />Warning</span>
          <span className="mp-chart-legend-chip"><span className="mp-chart-legend-line info-color" />Info</span>
          <span className="mp-chart-legend-delta">{totalIncidents} total · peak at {incidentData[peakHour.i].hour} UTC ({peakHour.total} concurrent)</span>
        </div>
      </Panel>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: RUNS — historical index, distinct from Overview
   ─────────────────────────────────────────────────────────────── */

const RunsPage = () => {
  const [stateFilter, setStateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');

  const allRuns = useMemo(() => [
    ...activeRuns.map(r => ({ ...r, finalLoss: r.loss, duration: r.startedAgo, failureReason: null })),
    ...historicalRuns,
  ], []);

  const owners = useMemo(() => {
    const set = new Set(allRuns.map(r => r.owner));
    return ['all', ...Array.from(set)];
  }, [allRuns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRuns.filter(r => {
      const stateMatch = stateFilter === 'all' || r.state === stateFilter;
      const ownerMatch = ownerFilter === 'all' || r.owner === ownerFilter;
      const searchMatch = !q
        || r.id.toLowerCase().includes(q)
        || r.config.toLowerCase().includes(q);
      return stateMatch && ownerMatch && searchMatch;
    });
  }, [allRuns, stateFilter, ownerFilter, search]);

  const meta = <span className="mp-meta-chip"><Globe2 size={10} />UTC</span>;

  return (
    <>
      <PageHeader
        title="Runs"
        subtitle="All runs ever — active, completed, failed, cancelled"
        meta={meta}
      />

      <div className="mp-stat-row">
        <StatCell label="Total" value={allRuns.length} detail="Last 30 days" />
        <StatCell label="Completed" value={allRuns.filter(r => r.state === 'completed').length} detail="Success rate 67%" delta="—" deltaDir="neutral" />
        <StatCell label="Failed" value={allRuns.filter(r => r.state === 'failed').length} detail="3 distinct causes" delta="-1" deltaDir="up" />
        <StatCell label="Active now" value={allRuns.filter(r => r.state === 'active').length} detail={`${activeRuns.reduce((s, r) => s + r.gpuCount, 0)} GPUs in use`} />
      </div>

      <div className="mp-filter-bar">
        <div className="mp-filter-input">
          <Search size={12} />
          <input
            placeholder="Filter by run name or config…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {(search || stateFilter !== 'all' || ownerFilter !== 'all') && (
            <span className="mp-filter-count">{filtered.length}/{allRuns.length}</span>
          )}
        </div>
        <div className="mp-filter-group">
          {['all', 'active', 'completed', 'failed', 'cancelled'].map(f => (
            <button
              key={f}
              className={`mp-filter-chip ${stateFilter === f ? 'active' : ''}`}
              onClick={() => setStateFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mp-filter-group">
          {owners.map(o => (
            <button
              key={o}
              className={`mp-filter-chip ${ownerFilter === o ? 'active' : ''}`}
              onClick={() => setOwnerFilter(o)}
            >
              {o === 'all' ? 'all owners' : o}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mp-empty">
          No runs match the current filters.
          <div className="mp-empty-mono">Try clearing the search or filter chips.</div>
        </div>
      ) : (
        <div>
          {filtered.map(run => {
            const progressPct = (run.step / run.totalSteps) * 100;
            const pillStatus = run.state === 'active'
              ? deriveStatus(run.subSignals)
              : run.state;
            const fillClass = run.state === 'failed' ? 'failed'
              : run.state === 'cancelled' ? 'cancelled'
              : run.state === 'completed' ? 'completed'
              : '';
            return (
              <div key={run.id} className="mp-run-row" tabIndex={0} role="button">
                <HealthPill status={pillStatus} />
                <div className="mp-run-row-name">
                  <span className="mp-run-row-title">{run.id}</span>
                  <span className="mp-run-row-config">{run.config} · {run.owner}</span>
                </div>
                <div className="mp-run-row-progress">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    <span>{run.step.toLocaleString()}</span>
                    <span>{progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="mp-run-row-progress-bar">
                    <div className={`mp-run-row-progress-fill ${fillClass}`} style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
                <div className="mp-run-row-stat">
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {run.state === 'active' ? 'Loss' : 'Final loss'}
                  </span>
                  <span className="mp-run-row-stat-val">
                    {run.finalLoss !== null && run.finalLoss !== undefined ? run.finalLoss.toFixed(3) : '—'}
                  </span>
                </div>
                <div className="mp-run-row-stat">
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Duration
                  </span>
                  <span className="mp-run-row-stat-val">{run.duration || run.startedAgo}</span>
                </div>
                <ChevronRight size={14} color="var(--text-tertiary)" />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: TRAINING — loss is hero; performance is investigative drawer
   ─────────────────────────────────────────────────────────────── */

const TrainingPage = ({ onToast }) => {
  const [anatomyOpen, setAnatomyOpen] = useState(false);
  const [phaseDetailOpen, setPhaseDetailOpen] = useState(false);
  const [phaseView, setPhaseView] = useState('compare');

  const dataMs = 11, fwdMs = 28, bwdMs = 46, optMs = 3;
  const totalMs = dataMs + fwdMs + bwdMs + optMs;
  const pct = v => (v / totalMs) * 100;

  const latest = trainingSteps[trainingSteps.length - 1];
  const gap = latest.evalLoss - latest.loss;

  const subSignals = activeRuns[0].subSignals;
  const runStatus = deriveStatus(subSignals);
  const runReason = activeRuns[0].reason;

  const allLosses = trainingSteps.flatMap(p => [p.loss, p.evalLoss]);
  const yMin = Math.max(0, Math.min(...allLosses) - 0.03);
  const yMax = Math.max(...allLosses) + 0.03;

  const meta = (
    <>
      <span className="mp-meta-chip live"><span className="mp-meta-pulse" />Live · 2s ago</span>
      <span className="mp-meta-chip"><Globe2 size={10} />UTC</span>
    </>
  );

  return (
    <>
      <PageHeader
        title="Training"
        subtitle="Step-level observability for the active run"
        meta={meta}
      />

      <div className="mp-run-strip">
        <div className="mp-run-strip-left">
          <HealthPill status={runStatus} />
          <div className="mp-run-name-block">
            <span className="mp-run-name">code-gen-7b / pretrain-v3</span>
            <span className="mp-run-config">7B · bf16 · FSDP × 8 × A100 · started 6d 12h ago</span>
            {runStatus !== 'healthy' && runReason && (
              <span className="mp-run-reason">
                <AlertTriangle size={11} strokeWidth={2.5} />
                {runReason} · see Run health
              </span>
            )}
          </div>
        </div>
        <div className="mp-run-strip-right">
          <RunStripStat label="Step" value="8,412 / 50,000" />
          <RunStripStat label="ETA" value="3d 11h" />
          <RunStripStat label="Throughput" value="18.3k tok/s" secondary="2,285/GPU · 8 GPUs" />
        </div>
      </div>

      <Panel
        hero
        title="Loss"
        description="Training vs. eval — the overfitting signal"
        action={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Eval/train gap</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: gap > 0.1 ? 'var(--status-warn)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {gap.toFixed(3)}
            </span>
          </div>
        }
      >
        <div className="mp-chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trainingSteps} margin={{ top: 12, right: 20, bottom: 32, left: 24 }}>
              <CartesianGrid stroke="#1e1e24" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="step"
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#71717a' }}
                tickLine={false}
                axisLine={{ stroke: '#27272f' }}
                tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                label={{ value: 'STEP', position: 'insideBottom', offset: -18, fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#71717a' }}
                tickLine={false}
                axisLine={{ stroke: '#27272f' }}
                tickFormatter={(v) => v.toFixed(2)}
                label={{ value: 'LOSS', angle: -90, position: 'insideLeft', offset: 4, fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}
              />
              <Tooltip
                content={<ChartTooltip xLabel="step" formatter={(v) => formatNum(v, 4)} />}
                cursor={{ stroke: '#34343e', strokeDasharray: '2 4' }}
              />
              <Line type="monotone" dataKey="loss"     name="Train" stroke="#8b5cf6" strokeWidth={2} dot={false} animationDuration={600} />
              <Line type="monotone" dataKey="evalLoss" name="Eval"  stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" dot={false} animationDuration={600} animationBegin={120} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mp-chart-legend">
          <span className="mp-chart-legend-chip"><span className="mp-chart-legend-line solid" />Train</span>
          <span className="mp-chart-legend-val">{latest.loss.toFixed(3)}</span>
          <span className="mp-chart-legend-chip" style={{ marginLeft: 12 }}><span className="mp-chart-legend-line dashed" />Eval</span>
          <span className="mp-chart-legend-val">{latest.evalLoss.toFixed(3)}</span>
          <span className="mp-chart-legend-delta">gap began widening ~step 4,000</span>
        </div>
      </Panel>

      <Panel title="Run health" description="Observed patterns over the last 500 steps">
        <div className="mp-health-grid">
          <div className="mp-health-cell ok">
            <span className="mp-stat-lbl">Gradient norm</span>
            <span className="mp-stat-val">0.84</span>
            <span className="mp-stat-detail">Stable · σ = 0.12</span>
          </div>
          <div className="mp-health-cell ok">
            <span className="mp-stat-lbl">Loss spikes</span>
            <span className="mp-stat-val">0</span>
            <span className="mp-stat-detail">No outliers {'>'} 3σ</span>
          </div>
          <div className="mp-health-cell ok">
            <span className="mp-stat-lbl">Throughput</span>
            <span className="mp-stat-val">18.3<span className="unit">k/s</span></span>
            <span className="mp-stat-detail">Cluster · σ = 3.4%</span>
          </div>
          <div className="mp-health-cell warn">
            <span className="mp-stat-lbl">Eval/train gap</span>
            <span className="mp-stat-val">{gap.toFixed(3)}</span>
            <span className="mp-stat-detail">Widening since step 4k</span>
          </div>
        </div>
      </Panel>

      <Panel
        title="Performance breakdown"
        description="Step-phase timings — open when throughput regresses"
        action={
          <button
            className="mp-btn ghost"
            onClick={() => setAnatomyOpen(!anatomyOpen)}
            aria-expanded={anatomyOpen}
          >
            <ChevronDown
              size={14}
              style={{ transform: anatomyOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base) var(--ease-out)' }}
            />
            {anatomyOpen ? 'Collapse' : 'Expand'}
          </button>
        }
      >
        {anatomyOpen && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Current step (ms per phase)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {totalMs}<span style={{ fontSize: 14, color: 'var(--text-tertiary)', marginLeft: 2, fontWeight: 400 }}>ms</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>per step</span>
              </div>
            </div>

            <div className="mp-anatomy-bar">
              <div className="mp-anatomy-seg data" style={{ width: `${pct(dataMs)}%` }}>
                <span className="mp-aseg-lbl">Data</span><span className="mp-aseg-val">{dataMs}ms</span>
              </div>
              <div className="mp-anatomy-seg fwd" style={{ width: `${pct(fwdMs)}%` }}>
                <span className="mp-aseg-lbl">Forward</span><span className="mp-aseg-val">{fwdMs}ms</span>
              </div>
              <div className="mp-anatomy-seg bwd" style={{ width: `${pct(bwdMs)}%` }}>
                <span className="mp-aseg-lbl">Backward</span><span className="mp-aseg-val">{bwdMs}ms</span>
              </div>
              <div className="mp-anatomy-seg opt" style={{ width: `${pct(optMs)}%` }}>
                <span className="mp-aseg-lbl">Opt</span><span className="mp-aseg-val">{optMs}ms</span>
              </div>
            </div>

            <div className="mp-anatomy-ticks">
              {[0, 25, 50, 75, 100].map((p, i) => (
                <div key={p} className="mp-anatomy-tick" style={{ left: `${p}%` }}>
                  <span className="mp-anatomy-tick-mark" />
                  <span className="mp-anatomy-tick-lbl">{Math.round((p / 100) * totalMs)}{i === 4 ? ' ms' : ''}</span>
                </div>
              ))}
            </div>

            <div className="mp-anatomy-legend">
              <div className="mp-alegend-item"><span className="mp-alegend-dot data" /><span className="mp-alegend-name">Data load</span><span className="mp-alegend-pct">{pct(dataMs).toFixed(1)}%</span></div>
              <div className="mp-alegend-item"><span className="mp-alegend-dot fwd" /><span className="mp-alegend-name">Forward pass</span><span className="mp-alegend-pct">{pct(fwdMs).toFixed(1)}%</span></div>
              <div className="mp-alegend-item"><span className="mp-alegend-dot bwd" /><span className="mp-alegend-name">Backward pass</span><span className="mp-alegend-pct">{pct(bwdMs).toFixed(1)}%</span></div>
              <div className="mp-alegend-item"><span className="mp-alegend-dot opt" /><span className="mp-alegend-name">Optimizer</span><span className="mp-alegend-pct">{pct(optMs).toFixed(1)}%</span></div>
            </div>

            {/* Historical phase timings — answers "is this normal or new?" */}
            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.01em' }}>
                  Phase timings · last 100 steps
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Track regressions over time — current frame is one point on this curve</p>
              </div>

              <div className="mp-chart-wrap">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={phaseTimingHistory} margin={{ top: 12, right: 20, bottom: 28, left: 16 }}>
                    <CartesianGrid stroke="#1e1e24" strokeDasharray="2 4" vertical={false} />
                    <XAxis
                      dataKey="step"
                      tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#71717a' }}
                      tickLine={false}
                      axisLine={{ stroke: '#27272f' }}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                      label={{ value: 'STEP', position: 'insideBottom', offset: -14, fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}
                    />
                    <YAxis
                      tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#71717a' }}
                      tickLine={false}
                      axisLine={{ stroke: '#27272f' }}
                      label={{ value: 'MS', angle: -90, position: 'insideLeft', offset: 10, fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}
                    />
                    <Tooltip
                      content={<ChartTooltip xLabel="step" formatter={(v) => `${formatNum(v, 1)} ms`} />}
                      cursor={{ stroke: '#34343e', strokeDasharray: '2 4' }}
                    />
                    <Line type="monotone" dataKey="data"      name="Data load"     stroke="#71717a"        strokeWidth={1.8} dot={false} animationDuration={500} animationBegin={0} />
                    <Line type="monotone" dataKey="forward"   name="Forward"       stroke="var(--brand-700)" strokeWidth={1.8} dot={false} animationDuration={500} animationBegin={80} />
                    <Line type="monotone" dataKey="backward"  name="Backward"      stroke="var(--brand-500)" strokeWidth={1.8} dot={false} animationDuration={500} animationBegin={160} />
                    <Line type="monotone" dataKey="optimizer" name="Optimizer"     stroke="var(--data-2)"    strokeWidth={1.8} dot={false} animationDuration={500} animationBegin={240} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mp-chart-legend">
                <span className="mp-chart-legend-chip"><span className="mp-chart-legend-line data-clr" />Data</span>
                <span className="mp-chart-legend-chip"><span className="mp-chart-legend-line fwd-clr" />Forward</span>
                <span className="mp-chart-legend-chip"><span className="mp-chart-legend-line bwd-clr" />Backward</span>
                <span className="mp-chart-legend-chip"><span className="mp-chart-legend-line opt-clr" />Optimizer</span>
                <span className="mp-chart-legend-delta">Data load drifted +47% in last 30 steps · investigate I/O</span>
              </div>
            </div>

            <button
              className="mp-btn ghost"
              style={{ marginTop: 'var(--space-5)' }}
              onClick={() => setPhaseDetailOpen(!phaseDetailOpen)}
              aria-expanded={phaseDetailOpen}
            >
              <Eye size={12} />
              {phaseDetailOpen ? 'Hide' : 'Show'} phase detail
            </button>

            {phaseDetailOpen && (
              <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-subtle)' }}>
                <div className="mp-phase-tabs">
                  {['compare', 'forward', 'backward'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPhaseView(p)}
                      className={`mp-phase-tab ${phaseView === p ? 'active' : ''}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {phaseView === 'compare' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="mp-phase-card">
                      <div className="mp-phase-card-lbl">Forward</div>
                      <div className="mp-phase-card-val">28 ms · 2,285 tok/s/GPU</div>
                      <div className="mp-phase-card-note">Activation mem 1.8GB · GPU util 92% · FLOPS util 64%</div>
                    </div>
                    <div className="mp-phase-card">
                      <div className="mp-phase-card-lbl">Backward</div>
                      <div className="mp-phase-card-val">46 ms · 1,391 tok/s/GPU</div>
                      <div className="mp-phase-card-note">Gradient mem 2.1GB · GPU util 88% · memory-bandwidth bound</div>
                    </div>
                  </div>
                )}

                {phaseView === 'forward' && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Forward pass runs inputs through the model. Currently <strong style={{ color: 'var(--text-primary)' }}>28ms per batch</strong> — within healthy range for a 7B dense transformer at 2048 sequence length. Compute-bound, not memory-bound.
                  </p>
                )}

                {phaseView === 'backward' && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Backward pass computes gradients for every parameter. Currently <strong style={{ color: 'var(--text-primary)' }}>46ms per batch, 64% slower than forward</strong> — expected for transformers. Gradient computation is memory-bandwidth bound.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: ALERTS — search + run filter + actions
   ─────────────────────────────────────────────────────────────── */

const AlertsPage = ({ onToast }) => {
  const [filter, setFilter] = useState('all');
  const [runFilter, setRunFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingActions, setPendingActions] = useState(new Set());

  const allRunIds = useMemo(() => {
    const set = new Set(alertStream.map(a => a.run));
    return ['all', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alertStream.filter(a => {
      const sevMatch = filter === 'all' || a.severity === filter;
      const runMatch = runFilter === 'all' || a.run === runFilter;
      const searchMatch = !q
        || a.run.toLowerCase().includes(q)
        || a.message.toLowerCase().includes(q)
        || a.detail.toLowerCase().includes(q)
        || String(a.step).includes(q);
      return sevMatch && runMatch && searchMatch;
    });
  }, [filter, runFilter, search]);

  const severityCounts = {
    critical: alertStream.filter(a => a.severity === 'critical').length,
    warning: alertStream.filter(a => a.severity === 'warning').length,
    info: alertStream.filter(a => a.severity === 'info').length,
  };

  const handleAction = (alertId, actionId, actionLabel) => {
    const key = `${alertId}-${actionId}`;
    setPendingActions(prev => new Set(prev).add(key));
    onToast(`${actionLabel} queued`);
    setTimeout(() => {
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 1600);
  };

  const meta = (
    <>
      <span className="mp-meta-chip live"><span className="mp-meta-pulse" />Live</span>
      <span className="mp-meta-chip"><Globe2 size={10} />UTC</span>
    </>
  );

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="Training-relevant incidents across active runs"
        meta={meta}
      />

      <div className="mp-stat-row">
        <StatCell label="Critical" value={severityCounts.critical} detail="Requires immediate action" />
        <StatCell label="Warnings" value={severityCounts.warning} detail="Monitor — may require intervention" />
        <StatCell label="Info" value={severityCounts.info} detail="Notable events" />
        <StatCell label="Resolved · 24h" value="14" detail="All automatic recoveries" delta="+2" deltaDir="up" />
      </div>

      <div className="mp-filter-bar">
        <div className="mp-filter-input">
          <Search size={12} />
          <input
            placeholder="Filter by run, message, or step…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {(search || filter !== 'all' || runFilter !== 'all') && (
            <span className="mp-filter-count">{filtered.length}/{alertStream.length}</span>
          )}
        </div>
        <div className="mp-filter-group">
          {['all', 'critical', 'warning', 'info'].map(f => (
            <button
              key={f}
              className={`mp-filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mp-filter-group">
          {allRunIds.map(r => (
            <button
              key={r}
              className={`mp-filter-chip ${runFilter === r ? 'active' : ''}`}
              onClick={() => setRunFilter(r)}
              title={r === 'all' ? 'All runs' : r}
            >
              {r === 'all' ? 'all runs' : r.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mp-empty">
          No alerts match the current filters.
          <div className="mp-empty-mono">Try clearing the search or filter chips.</div>
        </div>
      ) : (
        <div>
          {filtered.map(alert => (
            <div key={alert.id} className={`mp-alert-row ${alert.severity}`}>
              <div className="mp-alert-icon">
                {alert.severity === 'critical' && <XCircle size={16} />}
                {alert.severity === 'warning' && <AlertTriangle size={16} />}
                {alert.severity === 'info' && <Info size={16} />}
              </div>
              <div className="mp-alert-body">
                <span className="mp-alert-title">{alert.message}</span>
                <span className="mp-alert-detail">{alert.detail}</span>
                {alert.resolution && (
                  <div className="mp-alert-resolution">
                    <div className="mp-alert-resolution-text">
                      <strong>Resolution</strong>
                      <span>{alert.resolution}</span>
                    </div>
                    {alert.actions && alert.actions.length > 0 && (
                      <div className="mp-alert-actions">
                        {alert.actions.map(action => {
                          const key = `${alert.id}-${action.id}`;
                          const isPending = pendingActions.has(key);
                          return (
                            <button
                              key={action.id}
                              className={`mp-btn sm ${isPending ? 'success-flash' : ''}`}
                              onClick={() => handleAction(alert.id, action.id, action.label)}
                              disabled={isPending}
                            >
                              {isPending ? <CheckCircle2 size={12} /> : <ActionIcon name={action.icon} />}
                              {isPending ? 'Queued' : action.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mp-alert-meta">
                <span className="mp-alert-meta-run">{alert.run}</span>
                <span>step {alert.step.toLocaleString()}</span>
                <span>{alert.timestamp}</span>
              </div>
              <ChevronRight size={14} color="var(--text-tertiary)" />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: DATA INTEGRITY — sparklines per row
   ─────────────────────────────────────────────────────────────── */

const DataIntegrityPage = () => {
  const [expanded, setExpanded] = useState(null);

  const klStatus = (kl) => kl > 1.0 ? 'crit' : kl > 0.5 ? 'warn' : 'ok';
  const klBarWidth = (kl) => Math.min(100, (kl / 1.5) * 100);
  const klColor = (status) => status === 'crit' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#10b981';

  const meta = (
    <>
      <span className="mp-meta-chip live"><span className="mp-meta-pulse" />Updated 14m ago</span>
      <span className="mp-meta-chip"><Globe2 size={10} />UTC</span>
    </>
  );

  return (
    <>
      <PageHeader
        title="Data integrity"
        subtitle="Training distribution monitoring — catch silent pipeline bugs"
        meta={meta}
      />

      <div className="mp-stat-row">
        <StatCell label="Features tracked" value={dataIntegrityFeatures.length} detail="Input + training signals" />
        <StatCell
          label="Within thresholds"
          value={dataIntegrityFeatures.filter(f => f.status === 'ok').length}
          detail="KL < 0.5" delta="Healthy" deltaDir="up"
        />
        <StatCell
          label="Drifted"
          value={dataIntegrityFeatures.filter(f => f.status !== 'ok').length}
          detail="1 warn, 1 critical" delta="+1" deltaDir="down"
        />
        <StatCell label="Sample size" value="2.4M" detail="Last 12h window" />
      </div>

      <Panel
        title="Feature distribution stability"
        description="KL divergence between current training distribution and the epoch baseline. Sparkline shows last 24h trend."
      >
        <div className="mp-feature-table">
          <div className="mp-feature-table-header">
            <span>Feature</span>
            <span>Domain</span>
            <span>KL divergence</span>
            <span>24h trend</span>
            <span>Samples</span>
            <span></span>
            <span></span>
          </div>
          {dataIntegrityFeatures.map(f => {
            const status = klStatus(f.kl);
            const isOpen = expanded === f.name;
            return (
              <div key={f.name} className="mp-feature-row">
                <div
                  className="mp-feature-row-head"
                  onClick={() => setExpanded(isOpen ? null : f.name)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isOpen}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpanded(isOpen ? null : f.name);
                    }
                  }}
                >
                  <span className="mp-feature-name">{f.name}</span>
                  <span className="mp-feature-domain">{f.domain}</span>
                  <div className="mp-feature-kl-cell">
                    <div className="mp-feature-kl-bar">
                      <div
                        className={`mp-feature-kl-fill ${status}`}
                        style={{ width: `${klBarWidth(f.kl)}%` }}
                      />
                    </div>
                    <span className={`mp-feature-stat ${status === 'warn' ? 'high' : status === 'crit' ? 'critical' : ''}`}>
                      {f.kl.toFixed(2)}
                    </span>
                  </div>
                  <Sparkline data={klHistory[f.name]} color={klColor(status)} />
                  <span className="mp-feature-stat" style={{ textAlign: 'left' }}>
                    {(f.sampleCount / 1000).toFixed(0)}k
                  </span>
                  <span className={`mp-feature-status ${f.status}`} />
                  <ChevronRight size={14} className={`mp-feature-chevron ${isOpen ? 'open' : ''}`} />
                </div>
                {isOpen && (
                  <div className="mp-feature-row-expand">
                    <div className="mp-feature-expand-item">
                      <span className="mp-feature-expand-lbl">KL divergence</span>
                      <span className="mp-feature-expand-val">{f.kl.toFixed(3)}</span>
                    </div>
                    <div className="mp-feature-expand-item">
                      <span className="mp-feature-expand-lbl">PSI</span>
                      <span className="mp-feature-expand-val">{f.psi.toFixed(3)}</span>
                    </div>
                    <div className="mp-feature-expand-item">
                      <span className="mp-feature-expand-lbl">JS divergence</span>
                      <span className="mp-feature-expand-val">{f.js.toFixed(3)}</span>
                    </div>
                    <div className="mp-feature-expand-note">{f.note}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mp-insight-row">
          <AlertTriangle size={14} className="mp-insight-icon warn" />
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>gradient_magnitude</strong> drifted sharply in last 6h — KL 1.24 vs baseline. Likely cause: learning-rate schedule change at step 8,000 (expected). Sparkline confirms abrupt onset.
          </span>
        </div>
      </Panel>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: LOGS — live streaming with pause / autoscroll / cap
   ─────────────────────────────────────────────────────────────── */

const LOG_BUFFER_CAP = 200;

const LogsPage = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState(initialLogs);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [freshIds, setFreshIds] = useState(new Set());
  const streamRef = useRef(null);
  const containerRef = useRef(null);

  // Live stream
  useEffect(() => {
    if (paused) return;
    const tick = () => {
      const delay = 800 + Math.random() * 1700;
      streamRef.current = setTimeout(() => {
        const newLog = generateLogLine();
        setLogs(prev => [newLog, ...prev].slice(0, LOG_BUFFER_CAP));
        setFreshIds(prev => {
          const next = new Set(prev);
          next.add(newLog.id);
          return next;
        });
        // Clear fresh flag after animation
        setTimeout(() => {
          setFreshIds(prev => {
            const next = new Set(prev);
            next.delete(newLog.id);
            return next;
          });
        }, 300);
        tick();
      }, delay);
    };
    tick();
    return () => {
      if (streamRef.current) clearTimeout(streamRef.current);
    };
  }, [paused]);

  // Auto-scroll to top (newest log) when enabled
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(l => {
      const levelMatch = filter === 'all' || l.level === filter;
      const searchMatch = !q
        || l.msg.toLowerCase().includes(q)
        || l.run.toLowerCase().includes(q)
        || `r${l.rank}`.includes(q);
      return levelMatch && searchMatch;
    });
  }, [logs, filter, search]);

  const meta = paused ? (
    <>
      <span className="mp-meta-chip stale"><Pause size={10} />Paused</span>
      <span className="mp-meta-chip"><Globe2 size={10} />UTC</span>
    </>
  ) : (
    <>
      <span className="mp-meta-chip live"><span className="mp-meta-pulse" />Streaming</span>
      <span className="mp-meta-chip"><Globe2 size={10} />UTC</span>
    </>
  );

  return (
    <>
      <PageHeader title="Logs" subtitle="Live stream across all active runs" meta={meta} />

      <div className="mp-log-toolbar">
        <button
          className="mp-btn"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
        >
          {paused ? <><Play size={12} />Resume</> : <><Pause size={12} />Pause</>}
        </button>
        <button
          className={`mp-btn ${autoScroll ? '' : 'ghost'}`}
          onClick={() => setAutoScroll(!autoScroll)}
          aria-pressed={autoScroll}
        >
          <ArrowDown size={12} />
          Auto-scroll {autoScroll ? 'on' : 'off'}
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          {logs.length} / {LOG_BUFFER_CAP} buffered
        </span>
        <div className="mp-log-toolbar-spacer" />
        {paused && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--status-warn)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Stream paused
          </span>
        )}
      </div>

      <div className="mp-filter-bar">
        <div className="mp-filter-input">
          <Search size={12} />
          <input
            placeholder="Filter logs by message, rank, or run…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {(search || filter !== 'all') && (
            <span className="mp-filter-count">{filtered.length}/{logs.length}</span>
          )}
        </div>
        <div className="mp-filter-group">
          {['all', 'info', 'warn', 'error'].map(f => (
            <button
              key={f}
              className={`mp-filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mp-log-stream" ref={containerRef}>
        <div className="mp-log-stream-header">
          <span>TIMESTAMP</span>
          <span style={{ textAlign: 'center' }}>LEVEL</span>
          <span>RANK</span>
          <span>RUN</span>
          <span>MESSAGE</span>
        </div>
        {filtered.length === 0 ? (
          <div className="mp-empty" style={{ border: 'none', borderRadius: 0, margin: 0 }}>
            No log lines match.
            <div className="mp-empty-mono">Try clearing the search or level filter.</div>
          </div>
        ) : (
          filtered.map((log) => (
            <div key={log.id} className={`mp-log-row ${freshIds.has(log.id) ? 'fresh' : ''}`}>
              <span className="mp-log-ts">{log.ts}</span>
              <span className={`mp-log-level ${log.level}`}>{log.level.toUpperCase()}</span>
              <span className="mp-log-rank">r{log.rank}</span>
              <span className="mp-log-run">{log.run}</span>
              <span className="mp-log-msg">{log.msg}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: SETTINGS — Display, Notifications, Integrations, API
   ─────────────────────────────────────────────────────────────── */

const Toggle = ({ on, onChange, ariaLabel = null }) => (
  <button
    className={`mp-toggle ${on ? 'on' : ''}`}
    onClick={() => onChange(!on)}
    aria-pressed={on}
    aria-label={ariaLabel}
    type="button"
  />
);

const Segmented = ({ value, options, onChange }) => (
  <div className="mp-seg">
    {options.map(opt => (
      <button
        key={opt.value}
        className={`mp-seg-btn ${value === opt.value ? 'active' : ''}`}
        onClick={() => onChange(opt.value)}
        type="button"
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const FormRow = ({ label, help, children }) => (
  <div className="mp-form-row">
    <div className="mp-form-label-block">
      <span className="mp-form-label">{label}</span>
      {help && <span className="mp-form-help">{help}</span>}
    </div>
    {children}
  </div>
);

const DisplaySection = ({ display, setDisplay }) => (
  <Panel title="Display" description="How ModelPulse renders for you">
    <FormRow label="Theme" help="Light theme is on the roadmap.">
      <Segmented
        value={display.theme}
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light · soon' },
          { value: 'system', label: 'System' },
        ]}
        onChange={(v) => setDisplay({ ...display, theme: v })}
      />
    </FormRow>
    <FormRow label="Default timezone" help="Affects timestamps everywhere except logs (always UTC for forensics).">
      <select
        className="mp-select"
        value={display.timezone}
        onChange={(e) => setDisplay({ ...display, timezone: e.target.value })}
      >
        <option value="UTC">UTC</option>
        <option value="local">Local (device)</option>
        <option value="America/Los_Angeles">America/Los_Angeles</option>
        <option value="America/New_York">America/New_York</option>
        <option value="Europe/London">Europe/London</option>
        <option value="Asia/Tokyo">Asia/Tokyo</option>
      </select>
    </FormRow>
    <FormRow label="Density" help="Comfortable adds breathing room; compact fits more data per screen.">
      <Segmented
        value={display.density}
        options={[
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'compact', label: 'Compact' },
        ]}
        onChange={(v) => setDisplay({ ...display, density: v })}
      />
    </FormRow>
    <FormRow label="Numerical precision" help="Decimal places for loss, gradient norm, divergence metrics.">
      <Segmented
        value={display.precision}
        options={[
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ]}
        onChange={(v) => setDisplay({ ...display, precision: v })}
      />
    </FormRow>
    <FormRow label="Reduce motion" help="Disable chart entry animations and pulse effects.">
      <Toggle
        on={display.reduceMotion}
        onChange={(v) => setDisplay({ ...display, reduceMotion: v })}
        ariaLabel="Reduce motion"
      />
    </FormRow>
  </Panel>
);

const NotificationsSection = ({ routing, setRouting, channels, setChannels }) => {
  const channelLabels = { email: 'Email', slack: 'Slack', pagerduty: 'PagerDuty' };
  const severityLabels = { critical: 'Critical', warning: 'Warning', info: 'Info' };

  const toggle = (severity, channel) => {
    setRouting({
      ...routing,
      [severity]: { ...routing[severity], [channel]: !routing[severity][channel] }
    });
  };

  return (
    <Panel
      title="Alert routing"
      description="Where each severity level should be delivered. Critical events page, warnings notify, info is logged."
    >
      <div className="mp-routing-table">
        <div className="mp-routing-header">
          <span>Severity</span>
          <span>{channelLabels.email}</span>
          <span>{channelLabels.slack}</span>
          <span>{channelLabels.pagerduty}</span>
        </div>
        {['critical', 'warning', 'info'].map(sev => (
          <div key={sev} className="mp-routing-row">
            <span className={`mp-routing-severity ${sev}`}>
              {sev === 'critical' && <XCircle size={12} />}
              {sev === 'warning' && <AlertTriangle size={12} />}
              {sev === 'info' && <Info size={12} />}
              {severityLabels[sev]}
            </span>
            {['email', 'slack', 'pagerduty'].map(ch => (
              <div key={ch} className="mp-routing-cell">
                <Toggle
                  on={routing[sev][ch]}
                  onChange={() => toggle(sev, ch)}
                  ariaLabel={`${severityLabels[sev]} via ${channelLabels[ch]}`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <FormRow
          label="Slack channel · critical + warning"
          help="Channel for severity-routed Slack notifications."
        >
          <input
            className="mp-text-input"
            value={channels.slack}
            onChange={(e) => setChannels({ ...channels, slack: e.target.value })}
            placeholder="#training-alerts"
          />
        </FormRow>
        <FormRow
          label="Slack channel · info"
          help="Lower-priority informational events go here."
        >
          <input
            className="mp-text-input"
            value={channels.slackInfo}
            onChange={(e) => setChannels({ ...channels, slackInfo: e.target.value })}
            placeholder="#training-info"
          />
        </FormRow>
        <FormRow
          label="PagerDuty service"
          help="Only critical alerts page. Warnings never escalate to PagerDuty."
        >
          <input
            className="mp-text-input"
            value={channels.pagerduty}
            onChange={(e) => setChannels({ ...channels, pagerduty: e.target.value })}
            placeholder="training-oncall"
          />
        </FormRow>
        <FormRow
          label="Email recipients"
          help="Comma-separated list. Defaults to workspace admins."
        >
          <input
            className="mp-text-input"
            style={{ minWidth: 280 }}
            value={channels.email}
            onChange={(e) => setChannels({ ...channels, email: e.target.value })}
            placeholder="research-team@anthropic.com"
          />
        </FormRow>
      </div>
    </Panel>
  );
};

const integrations = [
  { id: 'slack',     name: 'Slack',           avatar: 'SL', gradient: 'linear-gradient(135deg, #4a154b, #ecb22e)', meta: '2 channels · last event 12m ago', connected: true },
  { id: 'pagerduty', name: 'PagerDuty',       avatar: 'PD', gradient: 'linear-gradient(135deg, #06ac38, #024d1d)', meta: '1 service · 0 active incidents', connected: true },
  { id: 's3',        name: 'S3 checkpoints',  avatar: 'S3', gradient: 'linear-gradient(135deg, #569a31, #2d5417)', meta: 'Bucket models-checkpoints · 47 GB used', connected: true },
  { id: 'wandb',     name: 'Weights & Biases',avatar: 'WB', gradient: 'linear-gradient(135deg, #ffcc33, #fcb003)', meta: 'Experiment tracking sync', connected: false },
];

const IntegrationsSection = ({ onToast }) => {
  const [conn, setConn] = useState(
    Object.fromEntries(integrations.map(i => [i.id, i.connected]))
  );
  const handleClick = (id, name, currentlyConnected) => {
    setConn({ ...conn, [id]: !currentlyConnected });
    onToast(currentlyConnected ? `${name} disconnected` : `${name} connected`);
  };
  return (
    <Panel
      title="Integrations"
      description="External services that power alerts and data sync"
    >
      <div className="mp-int-grid">
        {integrations.map(int => {
          const isConnected = conn[int.id];
          return (
            <div key={int.id} className="mp-int-card">
              <div className="mp-int-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36, height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: int.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12, fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    {int.avatar}
                  </div>
                  <div>
                    <div className="mp-int-name">{int.name}</div>
                    <div className="mp-int-meta">{isConnected ? int.meta : 'Not connected'}</div>
                  </div>
                </div>
                <span className={`mp-int-status ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? 'Connected' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isConnected ? (
                  <>
                    <button className="mp-btn sm" onClick={() => onToast(`${int.name} settings`)}>
                      Configure
                    </button>
                    <button
                      className="mp-btn sm danger"
                      onClick={() => handleClick(int.id, int.name, true)}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    className="mp-btn sm"
                    onClick={() => handleClick(int.id, int.name, false)}
                  >
                    <Plus size={12} />
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

const initialTokens = [
  { id: 't1', name: 'production-api-readonly', secret: 'mp_pat_••••••••3f9a', created: '14d ago', lastUsed: '2h ago', perms: 'read' },
  { id: 't2', name: 'ci-pipeline',             secret: 'mp_pat_••••••••8b21', created: '30d ago', lastUsed: '8m ago', perms: 'read+write' },
  { id: 't3', name: 'm-chen-laptop',           secret: 'mp_pat_••••••••a45c', created: '6d ago',  lastUsed: '1d ago', perms: 'read' },
];

const ApiSection = ({ onToast }) => {
  const [tokens, setTokens] = useState(initialTokens);

  const revoke = (id, name) => {
    setTokens(tokens.filter(t => t.id !== id));
    onToast(`Token ${name} revoked`);
  };

  const generate = () => {
    const id = `t-${Date.now()}`;
    const name = `new-token-${tokens.length + 1}`;
    setTokens([
      { id, name, secret: `mp_pat_••••••••${Math.random().toString(36).slice(-4)}`, created: 'just now', lastUsed: '—', perms: 'read' },
      ...tokens,
    ]);
    onToast(`Token ${name} created`);
  };

  return (
    <Panel
      title="API access"
      description="Personal access tokens for programmatic access. Tokens are shown once at creation, never again."
      action={
        <button className="mp-btn" onClick={generate}>
          <Plus size={12} />
          Generate token
        </button>
      }
    >
      {tokens.length === 0 ? (
        <div className="mp-empty">
          No active tokens.
          <div className="mp-empty-mono">Generate one to start using the API.</div>
        </div>
      ) : (
        <div className="mp-token-table">
          <div className="mp-token-header">
            <span>Name / Secret</span>
            <span>Created</span>
            <span>Last used</span>
            <span>Permissions</span>
            <span></span>
          </div>
          {tokens.map(token => (
            <div key={token.id} className="mp-token-row">
              <div>
                <div className="mp-token-name">{token.name}</div>
                <div className="mp-token-secret">{token.secret}</div>
              </div>
              <span className="mp-token-meta">{token.created}</span>
              <span className="mp-token-meta">{token.lastUsed}</span>
              <span className={`mp-token-perm ${token.perms.includes('write') ? 'write' : ''}`}>
                {token.perms}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="mp-btn sm ghost"
                  onClick={() => onToast(`Token ${token.name} copied`)}
                  aria-label={`Copy ${token.name}`}
                >
                  <Copy size={12} />
                </button>
                <button
                  className="mp-btn sm danger"
                  onClick={() => revoke(token.id, token.name)}
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};

const SettingsPage = ({ onToast }) => {
  const [tab, setTab] = useState('display');
  const [display, setDisplay] = useState({
    theme: 'dark',
    timezone: 'UTC',
    density: 'comfortable',
    precision: '3',
    reduceMotion: false,
  });
  const [routing, setRouting] = useState({
    critical: { email: true, slack: true, pagerduty: true },
    warning:  { email: false, slack: true, pagerduty: false },
    info:     { email: false, slack: true, pagerduty: false },
  });
  const [channels, setChannels] = useState({
    slack: '#training-alerts',
    slackInfo: '#training-info',
    pagerduty: 'training-oncall',
    email: 'research-team@anthropic.com',
  });

  const tabs = [
    { id: 'display', label: 'Display', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Hash },
    { id: 'api', label: 'API access', icon: Key },
  ];

  const meta = <span className="mp-meta-chip"><Globe2 size={10} />UTC</span>;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Account, workspace, and preferences"
        meta={meta}
      />
      <div className="mp-settings-shell">
        <div className="mp-settings-nav">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`mp-settings-nav-item ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <Icon size={14} className="mp-nav-icon" />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="mp-settings-section">
          {tab === 'display' && <DisplaySection display={display} setDisplay={setDisplay} />}
          {tab === 'notifications' && (
            <NotificationsSection
              routing={routing}
              setRouting={setRouting}
              channels={channels}
              setChannels={setChannels}
            />
          )}
          {tab === 'integrations' && <IntegrationsSection onToast={onToast} />}
          {tab === 'api' && <ApiSection onToast={onToast} />}
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   WORKSPACE SWITCHER
   ─────────────────────────────────────────────────────────────── */

const WorkspaceSwitcher = ({ current, onChange, onCreate, onSettings }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const escHandler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [open]);

  return (
    <div className="mp-ws-host" ref={ref}>
      <button
        className="mp-workspace"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="mp-workspace-avatar" style={{ background: current.gradient }}>
          {current.avatar}
        </div>
        <div className="mp-workspace-text">
          <span className="mp-workspace-name">{current.name}</span>
          <span className="mp-workspace-team">{current.team}</span>
        </div>
        <ChevronDown
          size={12}
          color="var(--text-tertiary)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms var(--ease-out)' }}
        />
      </button>
      {open && (
        <div className="mp-ws-popover" role="menu">
          <div className="mp-ws-popover-label">Switch workspace</div>
          {workspaces.map(ws => (
            <button
              key={ws.id}
              className="mp-ws-item"
              onClick={() => {
                onChange(ws);
                setOpen(false);
              }}
              role="menuitem"
            >
              <div className="mp-ws-item-avatar" style={{ background: ws.gradient }}>
                {ws.avatar}
              </div>
              <div className="mp-ws-item-text">
                <div className="mp-ws-item-name">{ws.name}</div>
                <div className="mp-ws-item-team">{ws.team}</div>
              </div>
              <span className="mp-ws-item-runs">
                {ws.activeRuns} {ws.activeRuns === 1 ? 'run' : 'runs'}
              </span>
              {ws.id === current.id && <Check size={14} className="mp-ws-item-check" />}
            </button>
          ))}
          <div className="mp-ws-divider" />
          <button
            className="mp-ws-item muted"
            onClick={() => { setOpen(false); onCreate(); }}
            role="menuitem"
          >
            <div className="mp-ws-item-avatar" style={{ background: 'var(--surface-active)', color: 'var(--text-secondary)' }}>
              <Plus size={14} />
            </div>
            <div className="mp-ws-item-text">
              <div className="mp-ws-item-name">New workspace</div>
            </div>
          </button>
          <button
            className="mp-ws-item muted"
            onClick={() => { setOpen(false); onSettings(); }}
            role="menuitem"
          >
            <div className="mp-ws-item-avatar" style={{ background: 'var(--surface-active)', color: 'var(--text-secondary)' }}>
              <Settings size={14} />
            </div>
            <div className="mp-ws-item-text">
              <div className="mp-ws-item-name">Workspace settings</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   APP SHELL
   ─────────────────────────────────────────────────────────────── */

const ModelPulse = () => {
  const [page, setPage] = useState('training');
  const [toast, setToast] = useState(null);
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleWorkspaceChange = (ws) => {
    if (ws.id === currentWorkspace.id) return;
    setCurrentWorkspace(ws);
    showToast(`Switched to ${ws.name}`);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'runs', label: 'Runs', icon: ListOrdered },
    { id: 'training', label: 'Training', icon: TrendingUp },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: 2 },
    { id: 'data', label: 'Data integrity', icon: ShieldCheck },
    { id: 'logs', label: 'Logs', icon: FileText },
  ];

  const renderPage = () => {
    switch (page) {
      case 'overview': return <OverviewPage onToast={showToast} />;
      case 'runs': return <RunsPage />;
      case 'training': return <TrainingPage onToast={showToast} />;
      case 'alerts': return <AlertsPage onToast={showToast} />;
      case 'data': return <DataIntegrityPage />;
      case 'logs': return <LogsPage />;
      case 'settings': return <SettingsPage onToast={showToast} />;
      default: return <TrainingPage onToast={showToast} />;
    }
  };

  return (
    <>
      <style>{designTokens}</style>
      <div className="mp-root">
        <div className="mp-app">
          <aside className="mp-sidebar">
            <div className="mp-brand">
              <div className="mp-brand-name">
                ModelPulse<span className="mp-brand-dot" />
              </div>
              <div className="mp-brand-meta">v 0.1 · internal</div>
            </div>

            <WorkspaceSwitcher
              current={currentWorkspace}
              onChange={handleWorkspaceChange}
              onCreate={() => showToast('New workspace flow')}
              onSettings={() => setPage('settings')}
            />

            <div className="mp-nav-section-label">Observability</div>
            <nav className="mp-nav">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`mp-nav-item ${page === item.id ? 'active' : ''}`}
                    onClick={() => setPage(item.id)}
                  >
                    <Icon size={14} className="mp-nav-icon" />
                    {item.label}
                    {item.badge && <span className="mp-nav-badge">{item.badge}</span>}
                  </button>
                );
              })}
            </nav>

            <div className="mp-sidebar-footer">
              <button
                className={`mp-nav-item ${page === 'settings' ? 'active' : ''}`}
                type="button"
                onClick={() => setPage('settings')}
              >
                <Settings size={14} className="mp-nav-icon" />
                Settings
              </button>
              <button className="mp-sidebar-user" type="button">
                <div className="mp-sidebar-user-avatar">YO</div>
                <div className="mp-sidebar-user-text">
                  <div className="mp-sidebar-user-name">you</div>
                  <div className="mp-sidebar-user-role">{currentWorkspace.role}</div>
                </div>
                <MoreHorizontal size={14} color="var(--text-tertiary)" />
              </button>
            </div>
          </aside>
          <main className="mp-main">
            {renderPage()}
          </main>
        </div>

        {toast && (
          <div className="mp-toast">
            <CheckCircle2 size={16} className="mp-toast-icon" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default ModelPulse;
