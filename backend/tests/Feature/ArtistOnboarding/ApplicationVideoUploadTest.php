<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Enums\UploadStatus;
use App\Enums\VideoStatus;
use App\Models\ArtistVideo;
use App\Models\Upload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Monolog\Handler\TestHandler;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\RunsQueuedJobs;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-047.1 (videos), L2-052.1, L2-052.2, L2-052.5, L2-076.1, L2-092 (apply-as-artist, ADR-0026): a
 * guest starts a video upload for their application, appends it in chunks, resumes after a dropped
 * connection, and watches it go Processing then Live; the file's type comes from its bytes, malware
 * is deleted, a file over 15 minutes fails with its reason, and a video never attached to an
 * application is deleted after 24 hours.
 */
class ApplicationVideoUploadTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use RunsQueuedJobs;
    use UsesTheWebApp;

    private const VIDEOS = '/api/v1/artist-applications/videos';

    private const CHUNK = 'application/offset+octet-stream';

    private const EICAR = 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

    /** The bytes an MP4 and a WebM start with; finfo reads them as video/mp4 and video/webm. */
    private const MP4_HEAD = "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom";

    private const WEBM_HEAD = "\x1A\x45\xDF\xA3\x9F\x42\x86\x81\x01\x42\xF7\x81\x01\x42\xF2\x81\x04\x42\xF3\x81\x08\x42\x82\x84webm\x42\x87\x81\x02\x42\x85\x81\x02";

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        Storage::fake('quarantine');
        Storage::fake('originals');
        Storage::fake('media');
        $this->queueOnTheDatabase();
    }

    public function test_a_guest_starts_an_upload_appends_it_in_chunks_and_watches_it_go_live(): void
    {
        $file = self::video(30_000);

        $started = $this->start('Way Maker — live at Cornerstone', 'way-maker.mp4', strlen($file));

        $started->assertCreated()
            ->assertJsonPath('data.status', 'uploading')
            ->assertJsonPath('data.title', 'Way Maker — live at Cornerstone')
            ->assertJsonPath('data.fileName', 'way-maker.mp4')
            ->assertJsonPath('data.size', 30_000)
            ->assertJsonPath('data.offset', 0);
        $this->assertMatchesContract($started);
        $token = $started->json('data.token');
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $token);
        $started->assertHeader('Location', url(self::VIDEOS."/{$token}"));

        $this->append($token, 0, substr($file, 0, 10_000))->assertNoContent()->assertHeader('Upload-Offset', '10000');
        $this->append($token, 10_000, substr($file, 10_000, 10_000))->assertNoContent()->assertHeader('Upload-Offset', '20000');
        $this->show($token)->assertOk()->assertJsonPath('data.status', 'uploading')->assertJsonPath('data.offset', 20_000);

        $this->append($token, 20_000, substr($file, 20_000))->assertNoContent()->assertHeader('Upload-Offset', '30000');

        // Complete: the bytes are in quarantine under a random name, typed by content, and the scan is queued.
        $this->show($token)->assertOk()->assertJsonPath('data.status', 'processing')->assertJsonPath('data.offset', 30_000);
        $video = ArtistVideo::where('upload_token', $token)->sole();
        $this->assertSame(VideoStatus::Processing, $video->status);
        $this->assertNull($video->artist_id);
        $upload = Upload::findOrFail($video->upload_id);
        $this->assertSame('video/mp4', $upload->detected_mime);
        $this->assertSame(UploadStatus::Quarantined, $upload->status);
        $this->assertNull($upload->user_id);
        $this->assertSame($file, Storage::disk('quarantine')->get($upload->quarantine_key));

        // The scan passes and the file moves to the originals disk; then it is probed and transcoded.
        $this->workNextJob('uploads');
        $this->assertSame(UploadStatus::Clean, $upload->fresh()->status);
        Storage::disk('quarantine')->assertMissing($upload->quarantine_key);
        $this->workNextJob('uploads');

        $response = $this->show($token)->assertOk()
            ->assertJsonPath('data.status', 'live')
            ->assertJsonPath('data.durationSeconds', 348)
            ->assertJsonPath('data.failureReason', null);
        $this->assertMatchesContract($response);
        $video->refresh();
        $this->assertSame(VideoStatus::Live, $video->status);
        $this->assertSame(348, $video->duration_seconds);
        Storage::disk('media')->assertExists($video->manifest_key);
        Storage::disk('media')->assertExists($video->poster_key);
        $this->assertStringContainsString($video->poster_key, $response->json('data.posterUrl'));
    }

    public function test_a_dropped_connection_resumes_from_the_last_completed_chunk(): void
    {
        $file = self::video(24_000);
        $token = $this->start('Way Maker — live at Cornerstone', 'way-maker.mp4', 24_000)->json('data.token');
        $this->append($token, 0, substr($file, 0, 8_000))->assertNoContent();
        $this->append($token, 8_000, substr($file, 8_000, 8_000))->assertNoContent();

        // The browser asks where the server got to, and continues from there.
        $this->offsetOf($token)->assertOk()->assertHeader('Upload-Offset', '16000')->assertHeader('Upload-Length', '24000');

        // A chunk from the wrong place is refused and changes nothing.
        $this->append($token, 8_000, substr($file, 8_000, 8_000))->assertStatus(409)
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/upload-offset-mismatch')
            ->assertHeader('Upload-Offset', '16000');
        $this->offsetOf($token)->assertHeader('Upload-Offset', '16000');

        $this->append($token, 16_000, substr($file, 16_000))->assertNoContent()->assertHeader('Upload-Offset', '24000');
        $this->show($token)->assertJsonPath('data.status', 'processing');
    }

    public function test_a_short_title_an_oversized_file_and_an_unknown_token_are_refused(): void
    {
        $this->start('Hymn', 'hymn.mp4', 1_000)->assertStatus(422)
            ->assertJsonPath('errors.title.0', 'Give the video a title of 5 to 100 characters.');
        $this->start('Great Is Thy Faithfulness, acoustic', 'hymn.mp4', 1024 * 1024 * 1024 + 1)->assertStatus(422)
            ->assertJsonPath('errors.size.0', 'Choose a video up to 1 GB.');

        $missing = str_repeat('0', 64);
        $this->offsetOf($missing)->assertNotFound();
        $this->show($missing)->assertNotFound();
        $this->append($missing, 0, 'bytes')->assertNotFound();
    }

    public function test_a_chunk_over_8_mb_or_of_another_type_is_refused(): void
    {
        $token = $this->start('Way Maker — live at Cornerstone', 'way-maker.mp4', 9 * 1024 * 1024)->json('data.token');

        $this->append($token, 0, str_repeat('a', 8 * 1024 * 1024 + 1))->assertStatus(413);
        $this->fromTheWebApp()->call('PATCH', self::VIDEOS."/{$token}", [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_UPLOAD_OFFSET' => '0', 'HTTP_ACCEPT' => 'application/json',
        ], '{"bytes":"no"}')->assertStatus(415);
        $this->offsetOf($token)->assertHeader('Upload-Offset', '0');
    }

    public function test_the_type_comes_from_the_bytes_so_a_webm_named_mp4_is_a_webm_and_html_is_refused(): void
    {
        $webm = self::WEBM_HEAD.str_repeat("\0", 2_000);
        $token = $this->start('Oceans, at the youth night', 'oceans.mp4', strlen($webm))->json('data.token');
        $this->append($token, 0, $webm)->assertNoContent();

        $video = ArtistVideo::where('upload_token', $token)->sole();
        $this->assertSame('video/webm', Upload::findOrFail($video->upload_id)->detected_mime);

        $html = '<!DOCTYPE html><html><body>not a video</body></html>'.str_repeat(' ', 2_000);
        $token = $this->start('A page, not a video', 'page.mp4', strlen($html))->json('data.token');
        $this->append($token, 0, $html)->assertNoContent();

        $this->show($token)->assertOk()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.failureReason', 'This file isn’t an MP4, MOV or WebM video.');
        $this->assertNull(ArtistVideo::where('upload_token', $token)->sole()->upload_id);
        // Its parts are gone; the WebM from before is still waiting for its scan.
        $this->assertSame([], Storage::disk('quarantine')->files("video-parts/{$token}"));
        $this->assertCount(1, Storage::disk('quarantine')->allFiles());
    }

    public function test_a_video_over_15_minutes_fails_with_its_reason(): void
    {
        $file = self::video(4_000, 'ZAMARO-DURATION=960');
        $token = $this->start('The whole evening service', 'evening.mp4', strlen($file))->json('data.token');
        $this->append($token, 0, $file)->assertNoContent();

        $this->workNextJob('uploads');
        $this->workNextJob('uploads');

        $this->show($token)->assertOk()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.failureReason', 'This video is 16 minutes long. Videos can be up to 15 minutes.');
        $this->assertSame([], Storage::disk('originals')->allFiles());
    }

    public function test_malware_is_deleted_logged_and_fails_the_video(): void
    {
        $log = new TestHandler;
        Log::channel('security')->getLogger()->pushHandler($log);
        $file = self::video(4_000, self::EICAR);
        $token = $this->start('Way Maker — live at Cornerstone', 'way-maker.mp4', strlen($file))->json('data.token');
        $this->append($token, 0, $file)->assertNoContent();

        $this->workNextJob('uploads');

        $this->show($token)->assertOk()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.failureReason', 'This file failed our malware scan and was deleted. Choose another video.');
        $this->assertSame([], Storage::disk('quarantine')->allFiles());
        $this->assertSame([], Storage::disk('originals')->allFiles());
        $this->assertTrue($log->hasWarningThatContains('upload.rejected_malware'));
    }

    public function test_a_video_never_attached_to_an_application_is_deleted_after_24_hours(): void
    {
        $file = self::video(4_000);
        $old = $this->start('Way Maker — live at Cornerstone', 'way-maker.mp4', strlen($file))->json('data.token');
        $this->append($old, 0, $file)->assertNoContent();
        $this->workNextJob('uploads');
        $this->workNextJob('uploads');
        $oldVideo = ArtistVideo::where('upload_token', $old)->sole();

        $this->travelTo(now()->addHours(23));
        $recent = $this->start('Oceans, at the youth night', 'oceans.mp4', 6_000)->json('data.token');
        $this->append($recent, 0, self::video(3_000))->assertNoContent();

        $this->travelTo(now()->addHours(2));
        $this->artisan('uploads:prune-unattached')->expectsOutputToContain('Deleted 1 unattached video')->assertSuccessful();

        $this->assertNull(ArtistVideo::where('upload_token', $old)->first());
        $this->assertNull(Upload::find($oldVideo->upload_id));
        Storage::disk('media')->assertMissing($oldVideo->manifest_key);
        Storage::disk('media')->assertMissing($oldVideo->poster_key);
        $this->assertSame([], Storage::disk('originals')->allFiles());
        $this->show($old)->assertNotFound();
        // The one still uploading is kept, parts and all.
        $this->offsetOf($recent)->assertOk()->assertHeader('Upload-Offset', '3000');
        $this->assertNotSame([], Storage::disk('quarantine')->allFiles());
    }

    /** A video file of `$bytes` in all: the MP4 header, a marker the fake transcoder reads, then filler. */
    private static function video(int $bytes, string $marker = ''): string
    {
        $head = self::MP4_HEAD.$marker;

        return $head.str_repeat("\0", max(0, $bytes - strlen($head)));
    }

    private function start(string $title, string $fileName, int $size): TestResponse
    {
        return $this->fromTheWebApp()->postJson(self::VIDEOS, ['title' => $title, 'fileName' => $fileName, 'size' => $size]);
    }

    private function append(string $token, int $offset, string $chunk): TestResponse
    {
        return $this->fromTheWebApp()->call('PATCH', self::VIDEOS."/{$token}", [], [], [], [
            'CONTENT_TYPE' => self::CHUNK,
            'CONTENT_LENGTH' => (string) strlen($chunk),
            'HTTP_UPLOAD_OFFSET' => (string) $offset,
            'HTTP_ACCEPT' => 'application/json',
        ], $chunk);
    }

    private function offsetOf(string $token): TestResponse
    {
        return $this->fromTheWebApp()->call('HEAD', self::VIDEOS."/{$token}", [], [], [], ['HTTP_ACCEPT' => 'application/json']);
    }

    private function show(string $token): TestResponse
    {
        return $this->fromTheWebApp()->getJson(self::VIDEOS."/{$token}");
    }
}
