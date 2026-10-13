<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Enums\VscStatus;
use App\Models\Artist;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use App\Notifications\VscRenewalReminderNotification;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * L2-049.3, L2-063, L2-092 (verify-vulnerable-sector-check): the daily run emails an artist whose
 * verified check runs out within 60 days, once, with a link to the profile editor's check section.
 * The cast's Daniel & Ruth Okonkwo hold a check verified until Mon 30 Nov 2026, 52 days from today.
 */
class VscRenewalRemindersTest extends TestCase
{
    use RefreshDatabase;

    private const COMMAND = 'vsc:send-renewal-reminders';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 09:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        Notification::fake();
    }

    public function test_the_daily_run_emails_the_artist_whose_check_runs_out_within_60_days(): void
    {
        $this->artisan(self::COMMAND)->expectsOutputToContain('1 renewal reminder')->assertSuccessful();

        $daniel = $this->daniel();
        Notification::assertSentToTimes($daniel, VscRenewalReminderNotification::class, 1);
        Notification::assertCount(1);
        Notification::assertSentTo($daniel, VscRenewalReminderNotification::class, function (VscRenewalReminderNotification $notification) use ($daniel) {
            $mail = $notification->toMail($daniel);
            $this->assertSame('Renew your Vulnerable Sector Check by Mon 30 Nov 2026', $mail->subject);
            $html = $mail->render()->toHtml();
            $this->assertStringContainsString('Hi Daniel,', $html);
            $this->assertStringContainsString('Renew by Mon 30 Nov 2026', $html);
            $this->assertStringContainsString(config('zamaro.web_url').'/artist/profile#check', $html);

            return true;
        });
        $this->assertSame(now()->utc()->toIso8601String(), $this->danielsCheck()->renewal_reminder_sent_at?->utc()->toIso8601String());
    }

    public function test_a_second_run_sends_nothing(): void
    {
        $this->artisan(self::COMMAND)->assertSuccessful();

        $this->artisan(self::COMMAND)->expectsOutputToContain('0 renewal reminders')->assertSuccessful();

        Notification::assertCount(1);
    }

    public function test_a_check_replaced_by_a_newer_verified_one_gets_no_reminder(): void
    {
        VulnerableSectorCheck::create([
            'user_id' => $this->daniel()->id, 'issued_on' => '2026-09-20', 'expires_on' => '2029-09-20',
            'status' => VscStatus::Verified, 'verified_at' => now(),
        ]);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Notification::assertNothingSent();
        $this->assertNull($this->danielsCheck()->renewal_reminder_sent_at);
    }

    public function test_a_run_missed_on_the_day_the_window_opened_is_caught_on_the_next(): void
    {
        // The window opened on Thu 1 Oct; nothing ran until Fri 2 Oct.
        $this->travelTo(Carbon::parse('2026-10-02 09:00', 'America/Toronto'));

        $this->artisan(self::COMMAND)->assertSuccessful();

        Notification::assertSentToTimes($this->daniel(), VscRenewalReminderNotification::class, 1);
    }

    public function test_a_check_outside_the_window_or_already_expired_gets_no_reminder(): void
    {
        // 61 days before Daniel & Ruth's expiry: not yet.
        $this->travelTo(Carbon::parse('2026-09-30 09:00', 'America/Toronto'));
        $this->artisan(self::COMMAND)->assertSuccessful();
        Notification::assertNothingSent();

        // Expired: the editor says "Expired" and Youth event searches no longer list them; no reminder.
        $this->travelTo(Carbon::parse('2026-12-01 09:00', 'America/Toronto'));
        $this->artisan(self::COMMAND)->assertSuccessful();
        Notification::assertNothingSent();
    }

    private function daniel(): User
    {
        return Artist::where('slug', 'daniel-and-ruth-okonkwo')->firstOrFail()->user;
    }

    private function danielsCheck(): VulnerableSectorCheck
    {
        return VulnerableSectorCheck::where('user_id', $this->daniel()->id)->where('expires_on', '2026-11-30')->sole();
    }
}
