import type { Locator, Page } from '@playwright/test';

/** The lineup of ticket cards under the Discover poster. */
export class Lineup {
  constructor(private readonly page: Page) {}

  private section(): Locator {
    return this.page.getByRole('region', { name: 'The lineup' });
  }

  /** "Sat 14 Nov · 7 free · within 120 km". */
  summary(): Locator {
    return this.section().locator('.section__kicker');
  }

  tickets(): Locator {
    return this.section().getByRole('listitem');
  }

  ticketNames(): Locator {
    return this.tickets().getByRole('heading', { level: 3 });
  }

  region(): Locator {
    return this.section();
  }

  /** The "Sold out" panel shown when nobody is free (L2-011). */
  soldOut(): SoldOut {
    return new SoldOut(this.section().getByRole('status').filter({ hasText: 'Nobody’s free' }));
  }

  showMoreButton(): Locator {
    return this.section().getByRole('button', { name: 'Show more artists' });
  }

  async showMore(): Promise<void> {
    await this.showMoreButton().click();
  }

  sortField(): Locator {
    return this.section().getByLabel('Sort');
  }

  async sortBy(label: string): Promise<void> {
    await this.sortField().selectOption({ label });
  }

  styleChip(name: string): Locator {
    return this.section()
      .getByRole('group', { name: 'Filter by style' })
      .getByRole('button', { name, exact: true });
  }

  async toggleStyle(name: string): Promise<void> {
    await this.styleChip(name).click();
  }

  /** What the polite live region last announced (L2-102.2). */
  announcement(): Locator {
    return this.page.locator('.cdk-live-announcer-element');
  }

  /** The status line announcing what is loading. */
  status(): Locator {
    return this.section().getByRole('status');
  }

  /** Placeholder cards shown while waiting; hidden from assistive technology. */
  skeletons(): Locator {
    return this.section().locator('.skeleton');
  }

  alert(): Locator {
    return this.section().getByRole('alert');
  }

  tryAgainButton(): Locator {
    return this.alert().getByRole('button', { name: /^Try again/ });
  }

  async tryAgain(): Promise<void> {
    await this.tryAgainButton().click();
  }

  emailLink(): Locator {
    return this.alert().getByRole('link', { name: 'Email the Zamaro team' });
  }

  statusLink(): Locator {
    return this.alert().getByRole('link', { name: 'Check status.zamaro.ca' });
  }

  ticket(name: string): Ticket {
    return new Ticket(this.tickets().filter({ has: this.page.getByRole('heading', { name, level: 3 }) }));
  }

  headliner(): Headliner {
    return new Headliner(this.section().getByRole('article'));
  }
}

export class SoldOut {
  constructor(private readonly panel: Locator) {}

  root(): Locator {
    return this.panel;
  }

  title(): Locator {
    return this.panel.getByRole('heading', { level: 3 });
  }

  /** The sentence explaining why, and the way forward. */
  explanation(): Locator {
    return this.panel.locator('.sold-out__why');
  }

  datesHeading(): Locator {
    return this.panel.getByRole('heading', { level: 4 });
  }

  nearbyDates(): Locator {
    return this.panel.getByRole('list').getByRole('button');
  }

  async pickDate(shortDate: string): Promise<void> {
    await this.nearbyDates().filter({ hasText: shortDate }).click();
  }

  widerRadiusButton(): Locator {
    return this.panel.getByRole('button', { name: /^Search within/ });
  }

  showAllStylesButton(): Locator {
    return this.panel.getByRole('button', { name: 'Show all styles' });
  }
}

/** The featured first result (L2-006). */
export class Headliner {
  constructor(private readonly card: Locator) {}

  root(): Locator {
    return this.card;
  }

  /** "No. 01 · Most booked this autumn". */
  kicker(): Locator {
    return this.card.locator('.headliner__kicker');
  }

  name(): Locator {
    return this.card.getByRole('heading', { level: 3 });
  }

  meta(): Locator {
    return this.card.locator('.headliner__meta');
  }

  quote(): Locator {
    return this.card.locator('.headliner__quote');
  }

  /** "Free Sat 14 Nov". */
  badge(): Locator {
    return this.card.locator('.badge');
  }

  profileLink(): Locator {
    return this.card.getByRole('link', { name: /^See / });
  }
}

export class Ticket {
  constructor(private readonly card: Locator) {}

  static at(lineup: Lineup, index: number): Ticket {
    return new Ticket(lineup.tickets().nth(index));
  }

  /** "No. 01". */
  position(): Locator {
    return this.card.locator('.ticket__no');
  }

  link(): Locator {
    return this.card.getByRole('heading', { level: 3 }).getByRole('link');
  }

  /** The act and styles line, then the place line ("Hamilton · 14 km from you"). */
  meta(): Locator {
    return this.card.locator('.ticket__meta');
  }

  price(): Locator {
    return this.card.locator('.ticket__price');
  }

  /** The rating, read as one labelled image ("Rated 4.6 out of 5 by 17 churches"). */
  rating(): Locator {
    return this.card.getByRole('img', { name: /^Rated / });
  }
}
