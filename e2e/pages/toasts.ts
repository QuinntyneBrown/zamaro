import type { Locator, Page } from "@playwright/test";

/** The toast region at the bottom of every page (docs/specs/components/toast), newest first. */
export class Toasts {
  constructor(private readonly page: Page) {}

  /** The toast whose title is `title`. */
  toast(title: string | RegExp): Toast {
    return new Toast(
      this.page
        .locator(".toast")
        .filter({
          has: this.page.locator(".toast__title", { hasText: title }),
        }),
    );
  }

  all(): Locator {
    return this.page.locator(".toast");
  }
}

export class Toast {
  constructor(private readonly root: Locator) {}

  locator(): Locator {
    return this.root;
  }

  /** The overline: "Saved", "Removed", "Failed". */
  kind(): Locator {
    return this.root.locator(".toast__kind");
  }

  title(): Locator {
    return this.root.locator(".toast__title");
  }

  text(): Locator {
    return this.root.locator(".toast__text");
  }

  /** A button ("Undo", "Try again") or link ("View saved") in the toast. */
  action(name: string): Locator {
    return this.root
      .locator(".toast__actions")
      .locator("a, button")
      .filter({ hasText: new RegExp(`^${name}$`) });
  }

  /** The progress bar of a timed toast; a danger toast has none. */
  progress(): Locator {
    return this.root.locator(".toast__progress");
  }

  dismissButton(): Locator {
    return this.root.getByRole("button", { name: /^Dismiss/ });
  }
}
