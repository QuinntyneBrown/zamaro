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

  ticket(name: string): Ticket {
    return new Ticket(this.tickets().filter({ has: this.page.getByRole('heading', { name, level: 3 }) }));
  }

  headliner(): Headliner {
    return new Headliner(this.section().getByRole('article'));
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
