import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';

// L2-018, L2-020.2, L2-060 and L2-083.2, with L2-098's review grid.
test.describe('Reviews on a profile', () => {
  let profile: ArtistProfilePage;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
    await new DiscoverPage(page).freezeClock();
  });

  test('"What churches say" shows the rating and the four newest reviews with replies', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await expect(profile.reviewsKicker()).toHaveText('Word of mouth');
    await expect(profile.reviewsHeading()).toHaveText('What churches say');
    await expect(profile.reviewsRating()).toHaveAccessibleName('Rated 4.9 out of 5 by 38 churches');
    await expect(profile.reviewsRating()).toHaveText('★★★★★ 4.9 · 38 churches');
    await expect(profile.reviews()).toHaveCount(4);
    expect(await profile.reviewerNames()).toEqual([
      'Rev. Janet Clarke',
      'Tomi Oduya',
      'Naomi Fraser',
      'Pastor Femi Adebayo',
    ]);

    const janet = profile.review('Rev. Janet Clarke');
    await expect(janet.stars()).toHaveAccessibleName('5 out of 5 stars');
    await expect(janet.stars()).toHaveText('★★★★★');
    await expect(janet.quote()).toHaveText(
      'She had the whole congregation singing in three-part harmony by the last verse.',
    );
    await expect(janet.source()).toHaveText('St. Brendan’s Anglican, Oshawa · September 2026');
    await expect(janet.replyMeta()).toHaveCount(0);

    const tomi = profile.review('Tomi Oduya');
    await expect(tomi.replyMeta()).toHaveText('Reply from Abigail Mensah · October 2026');
    await expect(tomi.replyText()).toHaveText(
      'Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov.',
    );
    await expect(profile.review('Naomi Fraser').replyMeta()).toHaveText(
      'Reply from Abigail Mensah · June 2026',
    );

    const femi = profile.review('Pastor Femi Adebayo');
    await expect(femi.stars()).toHaveAccessibleName('4 out of 5 stars');
    await expect(femi.stars()).toHaveText('★★★★☆');
    await expect(femi.source()).toHaveText('Living Waters Fellowship, Brampton · May 2026');

    // A guest gets no actions on a review (Report comes with sign-in).
    await expect(janet.buttons()).toHaveCount(0);
    await expect(profile.showMoreReviewsButton()).toHaveText('Show all 38 reviews');
  });

  test('"Show all" adds ten reviews at a time, newest first, and moves focus to the first new one', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await profile.showMoreReviews();

    await expect(profile.reviews()).toHaveCount(14);
    expect((await profile.reviewerNames()).slice(4, 6)).toEqual(['Pastor Samuel Osei', 'Ruth Kim']);
    await expect(profile.review('Pastor Samuel Osei').item).toBeFocused();
    await expect(profile.review('Pastor Samuel Osei').source()).toHaveText(
      'Cornerstone Baptist, Scarborough · May 2026',
    );
    await expect(profile.showMoreReviewsButton()).toHaveText('Show 10 more');

    await profile.showMoreReviews();
    await expect(profile.reviews()).toHaveCount(24);
    await profile.showMoreReviews();
    await expect(profile.reviews()).toHaveCount(34);
    await expect(profile.showMoreReviewsButton()).toHaveText('Show 4 more');

    await profile.showMoreReviews();
    await expect(profile.reviews()).toHaveCount(38);
    await expect(profile.showMoreReviewsButton()).toHaveCount(0);
    expect(new Set(await profile.reviewerNames()).size).toBe(38);
  });

  test('reviews sit one per row below MD and two per row from MD', async () => {
    await profile.useWidth(375);
    await profile.open(cast.artists.headliner.slug, cast.search.date);
    expect(await profile.reviewColumns()).toBe(1);

    await profile.useWidth(1024);
    expect(await profile.reviewColumns()).toBe(2);
  });

  test('an artist with no reviews keeps the section with "No church reviews yet"', async () => {
    await profile.open('miriam-haile');

    await expect(profile.reviewsHeading()).toHaveText('What churches say');
    await expect(profile.reviewsRating()).toHaveCount(0);
    await expect(profile.reviews()).toHaveCount(0);
    await expect(profile.reviewsEmptyState()).toContainText('No church reviews yet');
    await expect(profile.reviewsEmptyState()).toContainText(
      'Book Miriam and your church can be the first to say how it went.',
    );
    await expect(profile.reviewsEmptyState().getByRole('button')).toHaveText(
      'Be her first booking',
    );
    await expect(profile.showMoreReviewsButton()).toHaveCount(0);
  });
});
