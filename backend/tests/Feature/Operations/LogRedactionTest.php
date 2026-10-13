<?php

namespace Tests\Feature\Operations;

use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * L2-079.3: passwords, tokens, session IDs and payment identifiers beyond the last 4 digits never
 * reach the logs, whichever channel writes them (security/protect-secrets-and-data).
 */
class LogRedactionTest extends TestCase
{
    private string $logFile;

    protected function setUp(): void
    {
        parent::setUp();
        $this->logFile = tempnam(sys_get_temp_dir(), 'zamaro-log');
        config([
            'logging.default' => 'stderr',
            'logging.channels.stderr.with.stream' => $this->logFile,
        ]);
        Log::forgetChannel('stderr');
    }

    public function test_passwords_tokens_and_session_ids_are_redacted_at_any_depth(): void
    {
        Log::warning('sign-in failed', [
            'password' => 'hosanna-in-the-highest',
            'form' => [
                'current_password' => 'old-hymn-1984',
                'password_confirmation' => 'hosanna-in-the-highest',
                'challengeToken' => 'cf-challenge-7f3a',
            ],
            'headers' => ['X-XSRF-TOKEN' => 'eyJpdiI6xsrf', 'Cookie' => 'zamaro_session=abc123', 'Authorization' => 'Bearer t0k3n'],
            'remember_token' => 'remember-me-42',
            'session_id' => 'sess-9b2c',
            'email' => 'naomi.fraser@riversidecc.ca',
        ]);

        $line = $this->onlyLine();
        $this->assertSame('[REDACTED]', $line['context']['password']);
        $this->assertSame('[REDACTED]', $line['context']['form']['current_password']);
        $this->assertSame('[REDACTED]', $line['context']['form']['challengeToken']);
        $this->assertSame('[REDACTED]', $line['context']['headers']['X-XSRF-TOKEN']);
        $this->assertSame('[REDACTED]', $line['context']['session_id']);
        $this->assertSame('naomi.fraser@riversidecc.ca', $line['context']['email']);
        foreach (['hosanna-in-the-highest', 'old-hymn-1984', 'cf-challenge-7f3a', 'eyJpdiI6xsrf', 'abc123', 't0k3n', 'remember-me-42', 'sess-9b2c'] as $secret) {
            $this->assertStringNotContainsString($secret, file_get_contents($this->logFile));
        }
    }

    public function test_payment_identifiers_and_card_numbers_keep_only_their_last_4_digits(): void
    {
        Log::info('payout', [
            'processor_payment_id' => 'pi_3NxK2a8842',
            'note' => 'card 4242 4242 4242 4242 declined',
        ]);

        $line = $this->onlyLine();
        $this->assertSame('…8842', $line['context']['processor_payment_id']);
        $this->assertSame('card …4242 declined', $line['context']['note']);
    }

    public function test_message_bodies_are_redacted(): void
    {
        Log::info('message sent', ['body' => 'Call me on 905-555-0123']);

        $this->assertSame('[REDACTED]', $this->onlyLine()['context']['body']);
    }

    /** @return array<string, mixed> */
    private function onlyLine(): array
    {
        $lines = file($this->logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $this->assertCount(1, $lines);

        return json_decode($lines[0], true, flags: JSON_THROW_ON_ERROR);
    }
}
