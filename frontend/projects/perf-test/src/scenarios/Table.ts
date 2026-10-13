import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonLink, Table, type TableColumn } from 'components';

interface Row {
  id: string;
  applicant: string;
  act: string;
  city: string;
  submitted: string;
}

/** The applications queue (docs/mocks/pages/admin-applications/default.html): a row header link and an actions column. */
@Component({
  selector: 'zm-table-scenario',
  imports: [ButtonLink, Table],
  template: `<zm-table caption="Submitted, oldest first" [columns]="columns" [rows]="rows">
    <ng-template zmTableCell="applicant" let-row
      ><a [href]="'/admin/applications/' + row.id">{{ row.applicant }}</a></ng-template
    >
    <ng-template zmTableCell="actions" let-row
      ><zm-button-link size="sm" [link]="'/applications/' + row.id"
        >Review</zm-button-link
      ></ng-template
    >
  </zm-table>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TableScenario {
  protected readonly columns: TableColumn[] = [
    { key: 'applicant', header: 'Applicant' },
    { key: 'act', header: 'Act' },
    { key: 'city', header: 'Base city' },
    { key: 'submitted', header: 'Submitted' },
    { key: 'actions', header: 'Actions', headerHidden: true, actions: true, skeleton: 'control' },
  ];
  protected readonly rows: Row[] = [
    {
      id: 'A-0217',
      applicant: 'Ebenezer Brass Band',
      act: 'Band',
      city: 'Oshawa, ON',
      submitted: 'Tue 6 Oct, 4:20 p.m.',
    },
    {
      id: 'A-0218',
      applicant: 'Kezia & Mark Thompson',
      act: 'Duo',
      city: 'Pickering, ON',
      submitted: 'Thu 8 Oct, 9:05 p.m.',
    },
    {
      id: 'A-0219',
      applicant: 'Tobi Adeyemi',
      act: 'Solo',
      city: 'Scarborough, ON',
      submitted: 'Fri 9 Oct, 10:42 a.m.',
    },
  ];
}
