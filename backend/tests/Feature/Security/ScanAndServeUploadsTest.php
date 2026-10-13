<?php

namespace Tests\Feature\Security;

use App\Enums\UploadPurpose;
use App\Services\Security\ContentTypeDetector;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-075.4, L2-076.1 (security/scan-and-serve-uploads): upload routes take a multipart body up to their
 * own limit while every other route keeps the 1 MB JSON limit, and a file's type comes from its
 * content, with markup refused whatever it is called.
 */
class ScanAndServeUploadsTest extends TestCase
{
    use RefreshDatabase;
    use UsesTheWebApp;

    private const CHECKS = '/api/v1/artist/vulnerable-sector-checks';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        Storage::fake('quarantine');
    }

    public function test_only_upload_routes_take_a_body_over_1_mb(): void
    {
        $session = $this->asANewRequest()->withoutCookies()->signIn('abigail@abigailmensah.ca')->assertOk()->getCookie('zamaro_session')->getValue();
        $as = fn () => $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $session);

        $as()->call('PUT', '/api/v1/account/profile', [], [], [], ['CONTENT_TYPE' => 'application/json', 'CONTENT_LENGTH' => 2 * 1024 * 1024], json_encode(['name' => str_repeat('a', 2 * 1024 * 1024)]))
            ->assertStatus(413);

        $as()->post(self::CHECKS, ['file' => UploadedFile::fake()->createWithContent('check.pdf', str_pad("%PDF-1.4\n", 2 * 1024 * 1024, '0')), 'issuedOn' => '2026-10-05'], ['Accept' => 'application/json'])
            ->assertStatus(202);

        // A JSON body on the upload route is not refused as a type: it simply has no file.
        $as()->postJson(self::CHECKS, ['issuedOn' => '2026-10-05'])->assertStatus(422)->assertJsonValidationErrors(['file']);
    }

    public function test_a_files_type_comes_from_its_bytes_and_markup_is_refused_in_any_form(): void
    {
        $detector = app(ContentTypeDetector::class);
        $file = fn (string $contents) => tap(tempnam(sys_get_temp_dir(), 'zm'), fn ($path) => file_put_contents($path, $contents));

        $this->assertSame('application/pdf', $detector->detect($file("%PDF-1.4\n%%EOF")));
        $this->assertSame('image/png', $detector->detect($file("\x89PNG\r\n\x1a\n\x00\x00\x00\x0dIHDR".str_repeat("\0", 64))));
        $this->assertSame('image/jpeg', $detector->detect($file("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01".str_repeat("\0", 64))));
        $this->assertNull($detector->detect($file('<svg xmlns="http://www.w3.org/2000/svg"></svg>')));
        $this->assertNull($detector->detect($file("\xEF\xBB\xBF \n\t<!DOCTYPE html><html></html>")));
        $this->assertNull($detector->detect($file('<?xml version="1.0"?><root/>')));
        $this->assertSame(['application/pdf', 'image/jpeg', 'image/png'], UploadPurpose::VscDocument->allowedTypes());
    }
}
