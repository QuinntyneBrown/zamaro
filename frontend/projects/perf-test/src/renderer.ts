import { ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { scenarios } from './scenarios';

export type RenderType = 'mount' | 'rerender';

export interface PerfResult {
  scenario: string;
  iterations: number;
  renderType: RenderType;
  totalMs: number;
  meanMs: number;
  error?: string;
}

declare global {
  interface Window {
    __perfResult?: PerfResult;
  }
}

/** Reads ?scenario=&iterations=&renderType= and publishes the timing on window.__perfResult. */
export async function runFromLocation(appRef: ApplicationRef): Promise<PerfResult> {
  const params = new URLSearchParams(location.search);
  const scenario = params.get('scenario') ?? '';
  const iterations = Math.max(1, Number(params.get('iterations') ?? 100));
  const renderType: RenderType = params.get('renderType') === 'rerender' ? 'rerender' : 'mount';

  const base = { scenario, iterations, renderType };
  const load = scenarios[scenario];
  if (!load) {
    return publish({ ...base, totalMs: 0, meanMs: 0, error: `Unknown scenario "${scenario}"` });
  }

  const component = (await load()).default;
  const injector = appRef.injector.get(EnvironmentInjector);
  const host = document.createElement('div');
  document.body.appendChild(host);

  const started = performance.now();
  if (renderType === 'mount') {
    for (let i = 0; i < iterations; i++) {
      const ref = createComponent(component, { environmentInjector: injector, hostElement: host });
      ref.changeDetectorRef.detectChanges();
      ref.destroy();
    }
  } else {
    const ref = createComponent(component, { environmentInjector: injector, hostElement: host });
    for (let i = 0; i < iterations; i++) {
      ref.changeDetectorRef.detectChanges();
    }
    ref.destroy();
  }
  const totalMs = performance.now() - started;
  host.remove();

  return publish({ ...base, totalMs, meanMs: totalMs / iterations });
}

function publish(result: PerfResult): PerfResult {
  window.__perfResult = result;
  return result;
}
