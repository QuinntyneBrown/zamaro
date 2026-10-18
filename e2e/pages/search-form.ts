import { expect, type Locator, type Page } from '@playwright/test';

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

  /** The form's box, for layout checks. */
  async fieldsBox(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return this.form().boundingBox();
  }

  /** Whether two fields share a row (L2-097.2). */
  async shareARow(a: Locator, b: Locator): Promise<boolean> {
    const first = await a.boundingBox();
    const second = await b.boundingBox();
    return first !== null && second !== null && Math.abs(first.y - second.y) < 4;
  }

  /** The selected option's visible text. */
  async selectedText(field: Locator): Promise<string> {
    return field.evaluate((select: HTMLSelectElement) => select.selectedOptions[0]?.text ?? '');
  }

  /** The inline error a field points to with aria-describedby (L2-102.3). */
  async errorFor(field: Locator): Promise<Locator> {
    // The link appears with the error, after the submit re-renders the form.
    await expect(field).toHaveAttribute('aria-describedby', /\S/);
    const id = await field.getAttribute('aria-describedby');
    if (!id) throw new Error('The field has no aria-describedby, so no error is linked to it.');
    return this.page.locator(`[id="${id}"]`);
  }

  /** zm-error-summary, a group named by its title (form-layout CRD D-2). */
  errorSummary(): Locator {
    return this.form().locator('.error-summary');
  }

  async fill(search: { date?: string; kind?: string }): Promise<void> {
    if (search.date) await this.dateField().fill(search.date);
    if (search.kind) await this.kindField().selectOption({ label: search.kind });
  }

  /** Activates a quick-pick chip and waits until the location field holds the city. */
  async pickCity(city: string): Promise<void> {
    await this.cityChip(city).click();
    await expect(this.locationField()).toHaveValue(new RegExp(`^${city}`));
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
