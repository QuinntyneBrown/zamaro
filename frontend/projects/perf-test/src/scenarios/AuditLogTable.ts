import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Badge, Table, type TableColumn } from 'components';

interface Row {
  id: number;
  when: string;
  actor: string | null;
  caption: string | null;
  action: string;
  target: string;
  address: string;
  outcome: 'Succeeded' | 'Failed';
}

const ACTORS: [string, string][] = [
  ['Priya Nair', 'priya@zamaro.ca · Administrator'],
  ['Abigail Mensah', 'abigail@abigailmensah.ca · Artist'],
  ['Naomi Fraser', 'naomi.fraser@riversidecc.ca · Booker'],
];
const ACTIONS = [
  'auth.sign_in',
  'auth.mfa_challenge',
  'auth.password_changed',
  'refund.issued',
  'auth.sign_in_failed',
];

/** The audit log with 50 dense rows (docs/mocks/pages/admin-audit/default.html): two-line actor cells, code, badges. */
@Component({
  selector: 'zm-audit-log-table-scenario',
  imports: [Badge, Table],
  template: `<zm-table
    dense
    caption="Thu 1 Oct to Fri 9 Oct 2026, newest first"
    [columns]="columns"
    [rows]="rows"
    [sort]="{ key: 'when', direction: 'descending' }"
  >
    <ng-template zmTableCell="actor" let-row>
      @if (row.actor) {
        <span>{{ row.actor }}</span
        ><br /><span class="text-caption">{{ row.caption }}</span>
      } @else {
        <span class="text-muted">Unknown</span><br /><span class="text-caption">{{
          row.caption
        }}</span>
      }
    </ng-template>
    <ng-template zmTableCell="action" let-row
      ><code>{{ row.action }}</code></ng-template
    >
    <ng-template zmTableCell="outcome" let-row
      ><zm-badge [variant]="row.outcome === 'Succeeded' ? 'success' : 'danger'">{{
        row.outcome
      }}</zm-badge></ng-template
    >
  </zm-table>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuditLogTableScenario {
  protected readonly columns: TableColumn[] = [
    { key: 'when', header: 'When' },
    { key: 'actor', header: 'Actor' },
    { key: 'action', header: 'Action' },
    { key: 'target', header: 'Target' },
    { key: 'address', header: 'IP address' },
    { key: 'outcome', header: 'Outcome' },
  ];
  protected readonly rows: Row[] = Array.from({ length: 50 }, (_, i) => {
    const [actor, caption] = ACTORS[i % ACTORS.length]!;
    const failed = i % 7 === 3;
    return {
      id: i + 1,
      when: `Fri 9 Oct, ${String(11 - Math.floor(i / 6)).padStart(2, ' ')}:${String(59 - (i % 6) * 9).padStart(2, '0')} a.m.`,
      actor: failed && i % 2 ? null : actor,
      caption: failed && i % 2 ? 'tried admin@riversidecc.ca' : caption,
      action: ACTIONS[i % ACTIONS.length]!,
      target: `User · ${actor}`,
      address: '99.230.14.8',
      outcome: failed ? 'Failed' : 'Succeeded',
    };
  });
}
