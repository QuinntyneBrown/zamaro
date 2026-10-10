<?php

namespace Tests\Feature\ArtistProfiles;

use App\Models\ArtistPhoto;
use App\Models\ArtistVideo;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-014, L2-015 and L2-020.3: the profile's photos and live videos, public fields only. In M1 the
 * media disk is the API's local disk, served under /media (no object storage until M4).
 */
class ProfileMediaTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_photos_come_in_order_with_alt_text_and_responsive_renditions(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah');

        $response->assertOk()
            ->assertJsonCount(4, 'data.photos')
            ->assertJsonPath('data.photos.*.alt', [
                'Abigail at the microphone during a Sunday service',
                'Abigail rehearsing with a church volunteer band',
                'Portrait of Abigail smiling in a kente scarf',
                'Abigail leading a youth night from the floor, not the stage',
            ]);
        $photo = $response->json('data.photos.0');
        $this->assertSame(['id', 'alt', 'src', 'width', 'height', 'srcset', 'avifSrcset'], array_keys($photo));
        $this->assertSame([800, 600], [$photo['width'], $photo['height']]);
        $this->assertMatchesRegularExpression('#^/media/artists/abigail-mensah/photos/1-800\.webp$#', $photo['src']);
        foreach ([400, 800, 1200, 1600] as $width) {
            $this->assertStringContainsString("/media/artists/abigail-mensah/photos/1-{$width}.webp {$width}w", $photo['srcset']);
            $this->assertStringContainsString("/media/artists/abigail-mensah/photos/1-{$width}.avif {$width}w", $photo['avifSrcset']);
        }
        $this->assertMatchesContract($response);
    }

    public function test_live_videos_come_with_poster_stream_and_captions_and_processing_ones_stay_hidden(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah');

        $response->assertOk()
            ->assertJsonPath('data.videos.*.title', [
                'Way Maker — live at Bethel Pentecostal, Hamilton',
                'Great Is Thy Faithfulness — acoustic',
                'Twi praise medley — Harvest Sunday 2025',
                'Goodness of God — women’s retreat, Muskoka',
            ])
            ->assertJsonPath('data.videos.*.durationSeconds', [372, 280, 485, 330])
            ->assertJsonPath('data.videos.0.captions.lang', 'en')
            // The artist supplied no captions for the acoustic set.
            ->assertJsonPath('data.videos.1.captions', null);
        $video = $response->json('data.videos.0');
        $this->assertSame(['id', 'title', 'durationSeconds', 'poster', 'stream', 'captions'], array_keys($video));
        $this->assertStringStartsWith('/media/', $video['stream']);
        $this->assertStringEndsWith('.m3u8', $video['stream']);
        $this->assertStringEndsWith('.vtt', $video['captions']['src']);
        $this->assertSame(['src', 'width', 'height'], array_keys($video['poster']));
        $this->assertStringNotContainsString('Jireh', json_encode($response->json('data.videos')));
        $this->assertSame(5, ArtistVideo::whereRelation('artist', 'slug', 'abigail-mensah')->count());
        $this->assertMatchesContract($response);
    }

    public function test_an_artist_without_media_has_empty_lists(): void
    {
        $this->getJson('/api/v1/artists/miriam-haile')
            ->assertOk()
            ->assertJsonCount(2, 'data.photos')
            ->assertJsonPath('data.videos', []);

        $this->getJson('/api/v1/artists/marcus-bell-trio')
            ->assertOk()
            ->assertJsonPath('data.photos', [])
            ->assertJsonPath('data.videos', []);
    }

    public function test_seeding_again_adds_no_media_rows(): void
    {
        $photos = ArtistPhoto::count();
        $videos = ArtistVideo::count();

        $this->seed(CastSeeder::class);

        $this->assertSame($photos, ArtistPhoto::count());
        $this->assertSame($videos, ArtistVideo::count());
    }

    public function test_the_local_media_disk_serves_files_under_media(): void
    {
        Storage::fake('media');
        Storage::disk('media')->put('samples/video/stream.m3u8', "#EXTM3U\n");

        $response = $this->get('/media/samples/video/stream.m3u8')->assertOk();
        $this->assertSame("#EXTM3U\n", $response->streamedContent());
        $this->get('/media/samples/video/missing.m3u8')->assertNotFound();
        $this->get('/media/../.env')->assertNotFound();
    }
}
