<?php

namespace Tests\Feature\Operations;

use App\Contracts\Alert;
use App\Contracts\ErrorReporter;
use App\Contracts\OnCallAlerter;
use App\Enums\AlertSeverity;
use App\Integrations\Alerting\FakeOnCallAlerter;
use App\Integrations\ErrorTracking\FakeErrorReporter;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\Concerns\RunsQueuedJobs;
use Tests\TestCase;

/**
 * L2-092.1: a job that keeps failing moves to the failed-jobs store after its 6th attempt, and the
 * failure is reported to error tracking and raised to the on-call person with the job's name and the
 * request that queued it (operations/run-background-jobs, operations/monitor-health-and-errors).
 */
class BackgroundJobFailureTest extends TestCase
{
    use RefreshDatabase;
    use RunsQueuedJobs;

    private const REQUEST_ID = '9b0c5d1e-4f7a-4c2b-8e61-0d3a7f5c2b19';

    private User $ruth;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->queueOnTheDatabase();
        config(['zamaro.release' => '2026.10.09-1']);
        $this->ruth = User::factory()->unverified()->create(['name' => 'Ruth Adeyemi', 'email' => 'ruth.adeyemi@gracepoint.ca']);
    }

    public function test_a_job_that_fails_six_times_moves_to_the_failed_jobs_store(): void
    {
        $this->failTheMailTransport();
        $this->queueVerificationEmailDuringARequest();

        $this->assertSame(6, $this->workUntilTheQueueIsEmpty());

        $failed = DB::table('failed_jobs')->sole();
        $this->assertTrue(Str::isUuid($failed->uuid));
        $this->assertSame('database', $failed->connection);
        $this->assertSame('notifications', $failed->queue);
        $this->assertSame(VerifyEmailNotification::class, json_decode($failed->payload, true)['displayName']);
        $this->assertStringContainsString(TransportException::class, $failed->exception);
    }

    public function test_the_failure_is_reported_with_the_job_name_request_id_and_release(): void
    {
        $this->failTheMailTransport();
        $this->queueVerificationEmailDuringARequest();

        $this->workUntilTheQueueIsEmpty();

        $report = $this->onlyReport();
        $this->assertInstanceOf(TransportException::class, $report['exception']);
        $this->assertSame(self::REQUEST_ID, $report['requestId']);
        $this->assertSame('2026.10.09-1', $report['release']);
        $this->assertSame(VerifyEmailNotification::class, $report['context']['job']);
        $this->assertSame('notifications', $report['context']['queue']);
        $this->assertSame(6, $report['context']['attempts']);
    }

    public function test_the_on_call_person_is_alerted_once_with_the_job_name_and_request_id(): void
    {
        $this->failTheMailTransport();
        $this->queueVerificationEmailDuringARequest();

        $this->workUntilTheQueueIsEmpty();

        $alert = $this->onlyAlert();
        $this->assertSame('job-failed', $alert->key);
        $this->assertSame(AlertSeverity::Critical, $alert->severity);
        $this->assertStringContainsString(VerifyEmailNotification::class, $alert->summary);
        $this->assertStringContainsString(self::REQUEST_ID, $alert->summary);
        $this->assertSame(self::REQUEST_ID, $alert->context['requestId']);
    }

    public function test_a_job_that_succeeds_on_a_retry_is_neither_stored_nor_reported(): void
    {
        $this->failTheMailTransport();
        $this->queueVerificationEmailDuringARequest();
        $this->workNextJob('notifications');
        config(['mail.default' => 'array']);
        $this->travel($this->queuedJob()->available_at - now()->getTimestamp())->seconds();

        $this->workNextJob('notifications');

        $this->assertNull($this->queuedJob());
        $this->assertSame(0, DB::table('failed_jobs')->count());
        $this->assertSame([], $this->errorReporter()->reports);
        $this->assertSame([], $this->onCallAlerter()->alerts);
        $this->assertCount(1, app('mailer')->getSymfonyTransport()->messages());
    }

    public function test_the_fakes_record_what_they_are_sent_after_redaction(): void
    {
        app(ErrorReporter::class)->report(new RuntimeException('Card 4242 4242 4242 4242 declined'), self::REQUEST_ID, 'dev', [
            'job' => 'App\Jobs\Payments\ChargeBalance',
            'password' => 'hosanna-in-the-highest',
            'note' => 'card 4242 4242 4242 4242',
        ]);

        $report = $this->onlyReport();
        $this->assertSame('[REDACTED]', $report['context']['password']);
        $this->assertSame('card …4242', $report['context']['note']);
        $this->assertSame('App\Jobs\Payments\ChargeBalance', $report['context']['job']);
    }

    private function queueVerificationEmailDuringARequest(): void
    {
        Context::add('request_id', self::REQUEST_ID);
        $this->ruth->notify(new VerifyEmailNotification('plain-token', '/'));
        // The worker is another process: it knows the request only from the job's payload.
        Context::flush();
    }

    /** Every attempt, each when its backoff has passed; returns how many there were. */
    private function workUntilTheQueueIsEmpty(): int
    {
        for ($attempts = 0; $attempts < 10 && ($job = $this->queuedJob()) !== null; $attempts++) {
            $this->travel(max(0, $job->available_at - now()->getTimestamp()))->seconds();
            $this->workNextJob('notifications');
        }
        $this->assertNull($this->queuedJob());

        return $attempts;
    }

    /** @return array{exception: \Throwable, requestId: ?string, release: string, context: array<string, mixed>} */
    private function onlyReport(): array
    {
        $this->assertCount(1, $this->errorReporter()->reports);

        return $this->errorReporter()->reports[0];
    }

    private function onlyAlert(): Alert
    {
        $this->assertCount(1, $this->onCallAlerter()->alerts);

        return $this->onCallAlerter()->alerts[0];
    }

    private function errorReporter(): FakeErrorReporter
    {
        return app(ErrorReporter::class);
    }

    private function onCallAlerter(): FakeOnCallAlerter
    {
        return app(OnCallAlerter::class);
    }
}
