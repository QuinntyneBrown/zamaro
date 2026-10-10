<?php

namespace Tests\Feature\UserExperience;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * L2-111.1: CI fails when an email holds hard-coded words instead of catalogue messages, or asks for a
 * message the English catalogue lacks, and says where (user-experience/localise-formats-and-text).
 */
class TranslationCheckTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dir = sys_get_temp_dir().'/zamaro-i18n-check-'.uniqid();
        File::ensureDirectoryExists("{$this->dir}/views");
        File::ensureDirectoryExists("{$this->dir}/Notifications");
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->dir);
        parent::tearDown();
    }

    public function test_the_emails_in_the_repository_pass(): void
    {
        $this->artisan('i18n:check')
            ->expectsOutputToContain('No hard-coded text and no missing keys')
            ->assertSuccessful();
    }

    public function test_a_literal_word_in_an_email_view_fails_with_its_file_and_line(): void
    {
        $this->useFixtures(views: ['welcome.blade.php' => <<<'BLADE'
            {{-- WelcomeNotification --}}
            <x-mail::layout>
            Welcome
            {{ $greeting }}
            </x-mail::layout>
            BLADE]);

        $this->artisan('i18n:check')
            ->expectsOutputToContain("{$this->dir}/views/welcome.blade.php:3  hard-coded text \"Welcome\"")
            ->assertFailed();
    }

    public function test_blade_comments_echoes_and_mail_components_are_not_text(): void
    {
        $this->useFixtures(views: ['welcome.blade.php' => <<<'BLADE'
            {{-- Every word comes from the catalogue. --}}
            <x-mail::layout>
            <x-slot:header>
            <x-mail::header :url="$webUrl">
            {{ config('app.name') }}
            </x-mail::header>
            </x-slot:header>

            {{ $greeting }}

            <x-mail::button :url="$link">
            {{ $action }}
            </x-mail::button>
            </x-mail::layout>
            BLADE]);

        $this->artisan('i18n:check')->assertSuccessful();
    }

    public function test_a_key_missing_from_the_english_catalogue_fails_with_its_file_and_line(): void
    {
        $this->useFixtures(notifications: ['WelcomeNotification.php' => <<<'PHP'
            <?php

            class WelcomeNotification
            {
                public function toMail(object $notifiable)
                {
                    return $this->email($this->copy('welcome.subject'), 'welcome', [
                        'greeting' => $this->copy('verify.greeting', ['name' => 'Ruth']),
                    ]);
                }
            }
            PHP]);

        $this->artisan('i18n:check')
            ->expectsOutputToContain("{$this->dir}/Notifications/WelcomeNotification.php:7  missing key emails.welcome.subject")
            ->doesntExpectOutputToContain('emails.verify.greeting')
            ->assertFailed();
    }

    public function test_a_literal_subject_in_a_notification_class_fails(): void
    {
        $this->useFixtures(notifications: ['WelcomeNotification.php' => <<<'PHP'
            <?php

            class WelcomeNotification
            {
                public function toMail(object $notifiable)
                {
                    return (new MailMessage)
                        ->subject('Welcome to Zamaro')
                        ->markdown('emails.welcome');
                }
            }
            PHP]);

        $this->artisan('i18n:check')
            ->expectsOutputToContain("{$this->dir}/Notifications/WelcomeNotification.php:8  hard-coded text \"Welcome to Zamaro\"")
            ->assertFailed();
    }

    /**
     * @param  array<string, string>  $views
     * @param  array<string, string>  $notifications
     */
    private function useFixtures(array $views = [], array $notifications = []): void
    {
        foreach ($views as $name => $content) {
            File::put("{$this->dir}/views/{$name}", $content."\n");
        }
        foreach ($notifications as $name => $content) {
            File::put("{$this->dir}/Notifications/{$name}", $content."\n");
        }
        config([
            'zamaro.i18n.check.email_views' => "{$this->dir}/views",
            'zamaro.i18n.check.notifications' => "{$this->dir}/Notifications",
        ]);
    }
}
