import type { Locator, Page } from '@playwright/test';

/** The Discover search bar ("Your event"). */
export class SearchForm {
  constructor(private readonly page: Page) {}

  private form(): Locator {
    return this.page.getByRole('form', { name: /Your event/ });
  }

  dateField(): Locator {
    return this.form().getByLabel('Event date');
  }

  kindField(): Locator {
    return this.form().getByLabel('Kind of gathering');
  }

  locationField(): Locator {
    return this.form().getByLabel('Church location');
  }

  radiusField(): Locator {
    return this.form().getByLabel('How far can they drive?');
  }

  /** The selected option's visible text. */
  async selectedText(field: Locator): Promise<string> {
    return field.evaluate((select: HTMLSelectElement) => select.selectedOptions[0]?.text ?? '');
  }

  /** The inline error a field points to with aria-describedby (L2-102.3). */
  async errorFor(field: Locator): Promise<Locator> {
    const id = await field.getAttribute('aria-describedby');
    if (!id) throw new Error('The field has no aria-describedby, so no error is linked to it.');
    return this.page.locator(`[id="${id}"]`);
  }

  errorSummary(): Locator {
    return this.form().getByRole('alert');
  }

  async fill(search: { date?: string; kind?: string }): Promise<void> {
    if (search.date) await this.dateField().fill(search.date);
    if (search.kind) await this.kindField().selectOption({ label: search.kind });
  }

  async pickCity(city: string): Promise<void> {
    await this.form().getByRole('button', { name: city, exact: true }).click();
  }

  cityChip(city: string): Locator {
    return this.form().getByRole('button', { name: city, exact: true });
  }

  async typeLocation(place: string): Promise<void> {
    await this.locationField().fill(place);
  }

  async showTheLineup(): Promise<void> {
    await this.form().getByRole('button', { name: 'Show the lineup' }).click();
  }
}
