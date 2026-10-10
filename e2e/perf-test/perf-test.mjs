#!/usr/bin/env node
// Profiles each frontend/projects/perf-test scenario under the V8 CPU profiler in Chromium and,
// with --baseline, compares the change against the base branch's build.
//
//   node perf-test/perf-test.mjs [--dist <dir>] [--baseline <dir>] [--scenarios A,B] [--fail-on-regression]
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { defaultIterations, scenarioIterations } from './config/scenario-iterations.mjs';
import { thresholds, runs, renderTypes } from './config/thresholds.mjs';
import { excludedScenarios } from './config/excluded-scenarios.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '../..');
const logDir = join(here, 'logfiles');

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log('usage: perf-test.mjs [--dist <dir>] [--baseline <dir>] [--scenarios A,B] [--fail-on-regression]');
  process.exit(0);
}

const dist = resolve(args.dist ?? join(root, 'frontend/dist/perf-test'));
const baseline = args.baseline ? resolve(args.baseline) : undefined;
const names = args.scenarios?.split(',') ?? listScenarios();
const selected = names.filter((n) => !excludedScenarios.includes(n));

mkdirSync(logDir, { recursive: true });

if (selected.length === 0) {
  console.log('No scenarios registered yet; nothing to measure.');
  writeFileSync(join(logDir, 'perf-test.md'), '# Component perf test\n\nNo scenarios registered.\n');
  writeFileSync(join(logDir, 'results.json'), '[]\n');
  process.exit(0);
}

const browser = await chromium.launch();
const rows = [];
try {
  const branch = await serve(dist);
  const base = baseline ? await serve(baseline) : undefined;
  for (const renderType of renderTypes) {
    for (const scenario of selected) {
      const iterations = scenarioIterations[scenario] ?? defaultIterations;
      const pr = await measure(browser, branch.url, scenario, iterations, renderType, true);
      const prev = base ? await measure(browser, base.url, scenario, iterations, renderType, false) : undefined;
      rows.push(compare(scenario, renderType, pr, prev));
    }
  }
  branch.close();
  base?.close();
} finally {
  await browser.close();
}

const flagged = rows.filter((r) => r.status !== 'ok' && r.status !== 'new');
writeFileSync(join(logDir, 'results.json'), JSON.stringify(rows, null, 2) + '\n');
writeFileSync(join(logDir, 'perf-test.md'), table(rows));
console.log(table(rows));
if (args['fail-on-regression'] && flagged.length > 0) {
  console.error(`${flagged.length} scenario(s) flagged.`);
  process.exit(1);
}

// Both builds are timed the same way, without the profiler: its overhead would make the profiled
// side look slower. The .cpuprofile comes from one extra, untimed run.
async function measure(browser, url, scenario, iterations, renderType, profile) {
  if (profile) {
    const result = await render(browser, url, scenario, iterations, renderType, true);
    if (result.error) return { error: result.error, medians: [] };
  }
  const medians = [];
  for (let run = 0; run < runs; run++) {
    const result = await render(browser, url, scenario, iterations, renderType, false);
    if (result.error) return { error: result.error, medians: [] };
    medians.push(result.totalMs);
  }
  return { medians };
}

async function render(browser, url, scenario, iterations, renderType, profile) {
  const page = await browser.newPage();
  const client = await page.context().newCDPSession(page);
  if (profile) await client.send('Profiler.enable'), await client.send('Profiler.start');
  await page.goto(`${url}/?scenario=${scenario}&iterations=${iterations}&renderType=${renderType}`);
  const result = await page.waitForFunction(() => window.__perfResult, null, { timeout: 120000 }).then((h) => h.jsonValue());
  if (profile) {
    const { profile: cpu } = await client.send('Profiler.stop');
    writeFileSync(join(logDir, `${scenario}.${renderType}.cpuprofile`), JSON.stringify(cpu));
  }
  await page.close();
  return result;
}

function compare(scenario, renderType, pr, base) {
  if (pr.error) return { scenario, renderType, status: 'failed', detail: pr.error };
  const prMedian = median(pr.medians);
  if (!base || base.error) return { scenario, renderType, status: 'new', pr: prMedian };
  const baseMedian = median(base.medians);
  const slower = prMedian - baseMedian;
  const overlap = Math.min(...pr.medians) <= Math.max(...base.medians);
  const regression = slower / baseMedian > thresholds.relativeIncrease && slower >= thresholds.absoluteMs && !overlap;
  return { scenario, renderType, status: regression ? 'regression' : 'ok', pr: prMedian, base: baseMedian };
}

function table(rs) {
  const fmt = (n) => (n === undefined ? '-' : n.toFixed(1));
  const lines = ['# Component perf test', '', '| Scenario | Render | Base (ms) | PR (ms) | Result |', '|---|---|---|---|---|'];
  for (const r of rs) {
    const label = { ok: 'OK', new: 'New', regression: '**Possible regression**', failed: `**Failed to render**: ${r.detail}` }[r.status];
    lines.push(`| ${r.scenario} | ${r.renderType} | ${fmt(r.base)} | ${fmt(r.pr)} | ${label} |`);
  }
  return lines.join('\n') + '\n';
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function listScenarios() {
  const index = readFileSync(join(root, 'frontend/projects/perf-test/src/scenarios/index.ts'), 'utf8');
  return [...index.matchAll(/^\s*([A-Za-z0-9_]+):\s*\(\)\s*=>/gm)].map((m) => m[1]);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    out[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

function serve(dir) {
  const browserDir = existsSync(join(dir, 'browser')) ? join(dir, 'browser') : dir;
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };
  const server = createServer((req, res) => {
    let file = join(browserDir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(browserDir, 'index.html');
    res.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, () => ok({ url: `http://localhost:${server.address().port}`, close: () => server.close() })));
}
