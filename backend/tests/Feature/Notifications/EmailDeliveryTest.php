<?php

namespace Tests\Feature\Notifications;

use App\Models\User;
use App\Notifications\DuplicateSignUpNotification;
use App\Notifications\TransactionalNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\RunsQueuedJobs;
use Tests\TestCase;

/**
 * L2-065.2: an email that cannot be sent is retried with exponential backoff up to 5 times before it
 * fails and alerts (M2 D17: 10, 30, 90, 270 and 810 s, ±10 %). L2-063.2: every email has HTML and
 * plain-text parts and no card details (notifications/send-transactional-emails).
 */
class EmailDeliveryTest extends TestCase
{
    use RefreshDatabase;
    use RunsQueuedJobs;

    private const DELAYS = [10, 30, 90, 270, 810];

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
    }

    public function test_an_email_the_mail_server_refuses_is_retried_on_notifications_after_growing_delays(): void
    {
        $this->queueOnTheDatabase();
        $this->failTheMailTransport();
        $ruth = User::factory()->unverified()->create(['name' => 'Ruth Adeyemi', 'email' => 'ruth.adeyemi@gracepoint.ca']);

        $ruth->notify(new VerifyEmailNotification('plain-token', '/'));

        foreach (self::DELAYS as $attempt => $delay) {
            $this->workNextJob('notifications');

            $job = $this->queuedJob();
            $this->assertNotNull($job, 'Attempt '.($attempt + 1).' should be released for a retry.');
            $this->assertSame('notifications', $job->queue);
            $this->assertSame($attempt + 1, (int) $job->attempts);
            $wait = $job->available_at - now()->getTimestamp();
            $this->assertGreaterThanOrEqual((int) floor($delay * 0.9), $wait, "Retry {$attempt}'s delay");
            $this->assertLessThanOrEqual((int) ceil($delay * 1.1), $wait, "Retry {$attempt}'s delay");

            $this->travel($wait)->seconds();
        }

        $this->workNextJob('notifications');

        $this->assertNull($this->queuedJob(), 'The 6th failed attempt is the last.');
        $this->assertSame(1, DB::table('failed_jobs')->where('queue', 'notifications')->count());
    }

    public function test_a_job_that_is_not_due_yet_is_not_attempted_early(): void
    {
        $this->queueOnTheDatabase();
        $this->failTheMailTransport();
        $ruth = User::factory()->unverified()->create();
        $ruth->notify(new VerifyEmailNotification('plain-token', '/'));
        $this->workNextJob('notifications');

        $this->travel(8)->seconds();
        $this->workNextJob('notifications');

        $this->assertSame(1, (int) $this->queuedJob()->attempts);
    }

    public function test_every_zamaro_email_has_html_and_plain_text_parts_and_no_card_number(): void
    {
        $ruth = User::factory()->unverified()->create(['name' => 'Ruth Adeyemi', 'email' => 'ruth.adeyemi@gracepoint.ca']);

        foreach ($this->emails() as $notification) {
            $ruth->notify($notification);
        }

        $messages = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(count($this->emails()), $messages);
        foreach ($messages as $message) {
            $email = $message->getOriginalMessage();
            $this->assertNotEmpty($email->getHtmlBody(), $email->getSubject());
            $this->assertNotEmpty($email->getTextBody(), $email->getSubject());
            foreach ([$email->getHtmlBody(), $email->getTextBody()] as $part) {
                $this->assertDoesNotMatchRegularExpression('/(?<![\w-])\d(?:[ -]?\d){11,18}(?![\w-])/', $part, $email->getSubject());
            }
        }
    }

    /** @return list<TransactionalNotification> */
    private function emails(): array
    {
        return [
            new VerifyEmailNotification('plain-token', '/'),
            new DuplicateSignUpNotification(now()),
        ];
    }
}
