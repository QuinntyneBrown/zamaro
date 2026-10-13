<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Enums\UploadStatus;
use App\Enums\VscStatus;
use App\Models\Upload;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use App\Services\ArtistOnboarding\DocumentVault;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Monolog\Handler\TestHandler;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\RunsQueuedJobs;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-049.1, L2-075.4, L2-076.1–.2, L2-079.2, L2-092 (verify-vulnerable-sector-check,
 * scan-and-serve-uploads): an artist uploads a check, which is typed by content, quarantined, scanned
 * and then stored encrypted under a random name and queued for verification; malware is deleted and
 * logged; a scanner error retries and leaves the file in quarantine.
 */
class UploadVulnerableSectorCheckTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use RunsQueuedJobs;
    use UsesTheWebApp;

    private const CHECKS = '/api/v1/artist/vulnerable-sector-checks';

    private const PDF = "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n";

    private const EICAR = 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        Storage::fake('quarantine');
        Storage::fake('documents');
        $this->queueOnTheDatabase();
        $this->session = $this->asANewRequest()->withoutCookies()->signIn('abigail@abigailmensah.ca')->assertOk()
            ->getCookie('zamaro_session')->getValue();
    }

    public function test_a_pdf_check_is_accepted_quarantined_and_queued_for_the_scan(): void
    {
        $response = $this->upload(self::pdf('check.pdf', 2 * 1024 * 1024), '2026-10-05');

        $response->assertStatus(202)
            ->assertJsonPath('data.status', 'scanning')
            ->assertJsonPath('data.issuedOn', '2026-10-05')
            ->assertJsonPath('data.expiresOn', null);
        $this->assertMatchesContract($response);
        $upload = Upload::sole();
        $this->assertSame(UploadStatus::Quarantined, $upload->status);
        $this->assertSame('application/pdf', $upload->detected_mime);
        $this->assertSame(2 * 1024 * 1024, $upload->size_bytes);
        Storage::disk('quarantine')->assertExists($upload->quarantine_key);
        $this->assertSame('uploads', $this->queuedJob()->queue);
    }

    public function test_a_clean_file_is_stored_encrypted_under_a_random_name_and_the_check_waits_for_verification(): void
    {
        $this->upload(self::pdf('check.pdf', 64 * 1024), '2026-10-05')->assertStatus(202);

        $this->workNextJob('uploads');

        $check = VulnerableSectorCheck::where('status', VscStatus::Pending)->sole();
        $upload = Upload::sole();
        $this->assertSame(UploadStatus::Clean, $upload->status);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{32}$/', $check->storage_key);
        $this->assertSame('application/pdf', $check->mime_type);
        $this->assertNotNull($check->wrapped_data_key);
        Storage::disk('quarantine')->assertMissing($upload->quarantine_key);
        $stored = Storage::disk('documents')->get($check->storage_key);
        $this->assertStringNotContainsString('%PDF', $stored);
        $this->assertStringStartsWith('%PDF-1.4', app(DocumentVault::class)->read($check->storage_key, $check->wrapped_data_key));

        $current = $this->asAbigail()->getJson(self::CHECKS.'/current')->assertOk();
        $current->assertJsonPath('data.verified.status', 'verified')->assertJsonPath('data.latest.status', 'pending');
        $this->assertMatchesContract($current);
    }

    public function test_a_file_is_typed_by_its_content_not_its_name(): void
    {
        $this->upload(self::pdf('scan.png', 4096), '2026-10-05')->assertStatus(202);

        $this->assertSame('application/pdf', Upload::sole()->detected_mime);
    }

    public function test_svg_and_html_are_refused_whatever_they_are_called(): void
    {
        $svg = UploadedFile::fake()->createWithContent('check.pdf', '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        $html = UploadedFile::fake()->createWithContent('check.jpg', "  \n<!doctype html><html><body>hi</body></html>");

        foreach ([$svg, $html] as $file) {
            $response = $this->upload($file, '2026-10-05');
            $response->assertStatus(422)->assertJsonPath('errors.file.0', 'This file isn’t a PDF, JPEG or PNG. Choose a scan of the whole check.');
        }
        $this->assertSame(0, Upload::count());
        $this->assertSame(0, VulnerableSectorCheck::where('status', VscStatus::Scanning)->count());
    }

    public function test_a_file_over_10_mb_is_refused_with_its_size(): void
    {
        $response = $this->upload(self::pdf('check.pdf', 14 * 1024 * 1024), '2026-10-05');

        $response->assertStatus(422)->assertJsonPath('errors.file.0', 'This file is 14 MB. Choose a PDF, JPEG or PNG up to 10 MB.');
        $this->assertMatchesContract($response);
    }

    public function test_the_issue_date_is_required_and_cannot_be_in_the_future(): void
    {
        $this->upload(self::pdf('check.pdf', 4096), null)->assertStatus(422)
            ->assertJsonPath('errors.issuedOn.0', 'Enter the issue date printed on the check.');

        $this->upload(self::pdf('check.pdf', 4096), '2026-10-10')->assertStatus(422)->assertJsonValidationErrors(['issuedOn']);
        $this->upload(self::pdf('check.pdf', 4096), '2026-10-09')->assertStatus(202);
    }

    public function test_malware_is_deleted_the_check_blocked_and_a_security_event_logged(): void
    {
        $log = new TestHandler;
        Log::channel('security')->getLogger()->pushHandler($log);
        $this->upload(UploadedFile::fake()->createWithContent('check.pdf', self::PDF.self::EICAR), '2026-10-05')->assertStatus(202);
        $upload = Upload::sole();

        $this->workNextJob('uploads');

        $upload->refresh();
        $this->assertSame(UploadStatus::Rejected, $upload->status);
        $this->assertSame('malware', $upload->rejection_reason);
        $this->assertSame('EICAR-Test-File', $upload->scanner_signature);
        Storage::disk('quarantine')->assertMissing($upload->quarantine_key);
        $this->assertSame(0, Storage::disk('documents')->allFiles() === [] ? 0 : 1);
        $this->assertSame(VscStatus::Blocked, VulnerableSectorCheck::where('upload_id', $upload->id)->sole()->status);
        $this->assertTrue($log->hasWarningThatContains('upload.rejected_malware'));
        $record = collect($log->getRecords())->first();
        $this->assertSame('EICAR-Test-File', $record->context['signature']);
        $this->assertSame($upload->id, $record->context['upload_id']);
        $this->assertSame($this->abigail()->id, $record->context['user_id']);

        // Her earlier verified check still counts.
        $this->asAbigail()->getJson(self::CHECKS.'/current')->assertOk()
            ->assertJsonPath('data.verified.status', 'verified')->assertJsonPath('data.latest.status', 'blocked');
    }

    public function test_a_scanner_error_retries_and_leaves_the_file_in_quarantine(): void
    {
        $this->upload(UploadedFile::fake()->createWithContent('check.pdf', self::PDF.'SCANNER-UNAVAILABLE'), '2026-10-05')->assertStatus(202);

        $this->workNextJob('uploads');

        $upload = Upload::sole();
        $this->assertSame(UploadStatus::Quarantined, $upload->status);
        Storage::disk('quarantine')->assertExists($upload->quarantine_key);
        $job = $this->queuedJob();
        $this->assertNotNull($job);
        $this->assertSame(1, $job->attempts);
        $this->assertSame(0, DB::table('failed_jobs')->count());
    }

    public function test_a_booker_gets_404_because_the_endpoint_is_for_artists(): void
    {
        $this->session = $this->asANewRequest()->withoutCookies()->signIn('naomi.fraser@riversidecc.ca')->assertOk()
            ->getCookie('zamaro_session')->getValue();

        $this->upload(self::pdf('check.pdf', 4096), '2026-10-05')->assertNotFound();
        $this->asAbigail()->getJson(self::CHECKS.'/current')->assertNotFound();
    }

    private static function pdf(string $name, int $bytes): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, str_pad(self::PDF, $bytes, '0'));
    }

    private function upload(UploadedFile $file, ?string $issuedOn): TestResponse
    {
        return $this->asAbigail()->post(self::CHECKS, array_filter(['file' => $file, 'issuedOn' => $issuedOn]), ['Accept' => 'application/json']);
    }

    private function asAbigail(): static
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $this->session);
    }

    private function abigail(): User
    {
        return User::where('email', 'abigail@abigailmensah.ca')->sole();
    }
}
