<?php

namespace Tests\Feature\ArtistProfiles;

use App\Enums\MediaStatus;
use App\Models\Artist;
use App\Models\ArtistPhoto;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-014, L2-015 and L2-020.3: the profile's photos and live videos, and the media they point to.
 * In M1 the media disk is local and the API serves it under /media in place of the CDN.
 */
class ProfileMediaTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('media');
        config(['zamaro.media.base_url' => 'https://media.zamaro.test']);
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_abigails_photos_come_in_order_with_her_alt_text_and_every_width(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah');

        $response->assertOk()
            ->assertJsonCount(4, 'data.photos')
            ->assertJsonPath('data.photos.0.alt', 'Abigail at the microphone during a Sunday service')
            ->assertJsonPath('data.photos.3.alt', 'Abigail leading a youth night from the floor, not the stage')
            ->assertJsonPath('data.photos.0.width', 800)
            ->assertJsonPath('data.photos.0.height', 600);
        $photo = $response->json('data.photos.0');
        $this->assertMatchesRegularExpression('#^https://media\.zamaro\.test/photos/[\w-]+-800\.webp$#', $photo['src']);
        $this->assertSame(['400w', '800w', '1200w', '1600w'], array_map(
            fn (string $candidate) => explode(' ', $candidate)[1],
            explode(', ', $photo['srcset']),
        ));
        $this->assertMatchesContract($response);
    }

    public function test_only_live_videos_are_public_with_stream_poster_and_captions(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah');

        $response->assertOk()
            ->assertJsonCount(4, 'data.videos')
            ->assertJsonPath('data.videos.*.title', [
                'Way Maker — live at Bethel Pentecostal, Hamilton',
                'Great Is Thy Faithfulness — acoustic',
                'Twi praise medley — Harvest Sunday 2025',
                'Goodness of God — women’s retreat, Muskoka',
            ])
            ->assertJsonPath('data.videos.0.durationSeconds', 372)
            ->assertJsonPath('data.videos.0.captions.language', 'en');
        $video = $response->json('data.videos.0');
        $this->assertStringEndsWith('.m3u8', $video['stream']);
        $this->assertStringEndsWith('.en.vtt', $video['captions']['src']);
        $this->assertStringEndsWith('-800.webp', $video['poster']['src']);
        // Jireh is still processing (docs/mocks/pages/edit-profile/video-processing): never public.
        $this->assertNotContains('Jireh — live at Living Waters, Brampton', $response->json('data.videos.*.title'));
    }

    public function test_a_photo_still_being_processed_is_not_public(): void
    {
        ArtistPhoto::whereHas('artist', fn ($artists) => $artists->where('slug', 'abigail-mensah'))
            ->where('position', 2)->update(['status' => MediaStatus::Processing]);

        $this->getJson('/api/v1/artists/abigail-mensah')->assertJsonCount(3, 'data.photos');
    }

    public function test_an_artist_with_no_media_has_empty_lists(): void
    {
        $response = $this->getJson('/api/v1/artists/marcus-bell-trio');

        $response->assertOk()->assertJsonPath('data.photos', [])->assertJsonPath('data.videos', []);
        $this->assertMatchesContract($response);
        $this->getJson('/api/v1/artists/miriam-haile')->assertJsonCount(2, 'data.photos')->assertJsonPath('data.videos', []);
    }

    public function test_the_media_route_serves_seeded_files_with_their_type(): void
    {
        $key = Artist::where('slug', 'abigail-mensah')->firstOrFail()->photos()->firstOrFail()->renditions[0]['key'];

        $this->get("/media/{$key}")
            ->assertOk()
            ->assertHeader('Content-Type', 'image/webp')
            ->assertHeader('Access-Control-Allow-Origin', '*')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->get('/media/videos/sample.m3u8')->assertOk()->assertHeader('Content-Type', 'application/vnd.apple.mpegurl');
    }

    public function test_the_media_route_serves_nothing_else(): void
    {
        Storage::disk('media')->put('notes.txt', 'private');

        $this->get('/media/notes.txt')->assertNotFound();
        $this->get('/media/photos/missing-800.webp')->assertNotFound();
        $this->get('/media/../.env')->assertNotFound();
    }
}
