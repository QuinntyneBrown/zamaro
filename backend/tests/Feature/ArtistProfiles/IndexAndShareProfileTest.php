<?php

namespace Tests\Feature\ArtistProfiles;

use App\Enums\ArtistStatus;
use App\Models\Artist;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-089.1 and L2-112.3: public profile responses revalidate with a strong ETag and are shared for at
 * most 60 seconds; the sitemap lists every published profile and nothing else.
 */
class IndexAndShareProfileTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_the_profile_carries_a_strong_etag_and_is_shared_for_60_seconds(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah');

        $response->assertOk();
        $this->assertMatchesRegularExpression('/^"[a-f0-9]{32}"$/', (string) $response->headers->get('ETag'));
        $this->assertCacheControl('public, max-age=0, s-maxage=60', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_a_matching_if_none_match_answers_304_without_a_body(): void
    {
        $etag = $this->getJson('/api/v1/artists/abigail-mensah')->headers->get('ETag');

        $response = $this->getJson('/api/v1/artists/abigail-mensah', ['If-None-Match' => $etag]);

        $response->assertStatus(304);
        $this->assertSame('', $response->getContent());
        $this->assertSame($etag, $response->headers->get('ETag'));
    }

    public function test_an_edited_profile_has_a_new_etag_so_the_old_copy_is_not_reused(): void
    {
        $etag = $this->getJson('/api/v1/artists/abigail-mensah')->headers->get('ETag');
        Artist::where('slug', 'abigail-mensah')->update(['headline' => 'Gospel, hymns and contemporary']);

        $response = $this->getJson('/api/v1/artists/abigail-mensah', ['If-None-Match' => $etag]);

        $response->assertOk()->assertJsonPath('data.headline', 'Gospel, hymns and contemporary');
        $this->assertNotSame($etag, $response->headers->get('ETag'));
    }

    public function test_the_tour_dates_and_the_date_check_revalidate_with_their_etags(): void
    {
        foreach ([
            '/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-14',
            '/api/v1/artists/abigail-mensah/availability?date=2026-11-14',
        ] as $url) {
            $first = $this->getJson($url);
            $etag = $first->headers->get('ETag');
            $this->assertMatchesRegularExpression('/^"[a-f0-9]{32}"$/', (string) $etag, $url);
            $this->assertMatchesContract($first);

            $this->getJson($url, ['If-None-Match' => $etag])->assertStatus(304);
        }
    }

    public function test_a_missing_artist_and_a_renamed_address_carry_no_etag(): void
    {
        $missing = $this->getJson('/api/v1/artists/selah-brooks');
        $missing->assertNotFound();
        $this->assertNull($missing->headers->get('ETag'));

        $moved = $this->getJson('/api/v1/artists/abigail-sings');
        $moved->assertStatus(301);
        $this->assertNull($moved->headers->get('ETag'));
    }

    public function test_the_sitemap_lists_every_published_profile_with_its_last_change(): void
    {
        Artist::where('slug', 'abigail-mensah')->update(['updated_at' => Carbon::parse('2026-10-01 12:00')]);

        $response = $this->getJson('/api/v1/sitemap');

        $response->assertOk()
            ->assertJsonCount(Artist::query()->visible()->count(), 'data')
            ->assertJsonFragment(['slug' => 'abigail-mensah', 'lastModified' => '2026-10-01'])
            ->assertJsonFragment(['slug' => 'miriam-haile']);
        $this->assertStringContainsString('public', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_the_sitemap_leaves_out_suspended_unpublished_and_deleted_artists(): void
    {
        Artist::where('slug', 'miriam-haile')->update(['published_at' => null]);
        Artist::where('slug', 'marcus-bell-trio')->update(['status' => ArtistStatus::Deleted]);

        $slugs = $this->getJson('/api/v1/sitemap')->json('data.*.slug');

        $this->assertContains('abigail-mensah', $slugs);
        $this->assertNotContains('selah-brooks', $slugs);
        $this->assertNotContains('miriam-haile', $slugs);
        $this->assertNotContains('marcus-bell-trio', $slugs);
    }

    private function assertCacheControl(string $expected, ?string $actual): void
    {
        $parts = fn (?string $header) => collect(explode(',', (string) $header))->map(fn ($part) => trim($part))->sort()->values()->all();

        $this->assertSame($parts($expected), $parts($actual));
    }
}
