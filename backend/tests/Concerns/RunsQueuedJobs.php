<?php

namespace Tests\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;

/**
 * Jobs queued and worked as Zamaro Worker runs them, on the `database` connection the test database
 * holds, so attempts, backoff and the failed-jobs store are real. The suite's own `sync` connection
 * runs a job once and rethrows.
 */
trait RunsQueuedJobs
{
    protected function queueOnTheDatabase(): void
    {
        config(['queue.default' => 'database']);
    }

    /** Every send throws, as an unreachable mail server does. */
    protected function failTheMailTransport(): void
    {
        Mail::extend('unreachable', fn () => new class extends AbstractTransport
        {
            protected function doSend(SentMessage $message): void
            {
                throw new TransportException('Connection could not be established with host "mailpit:1025".');
            }

            public function __toString(): string
            {
                return 'unreachable://';
            }
        });
        config(['mail.default' => 'unreachable', 'mail.mailers.unreachable' => ['transport' => 'unreachable']]);
    }

    /** One attempt of the next job that is due on the queue, as `queue:work --once` makes it. */
    protected function workNextJob(string $queue): void
    {
        $this->artisan('queue:work', ['connection' => 'database', '--queue' => $queue, '--once' => true, '--sleep' => 0])
            ->assertSuccessful();
    }

    /** @return object{id: int, queue: string, attempts: int, available_at: int}|null */
    protected function queuedJob(): ?object
    {
        return DB::table('jobs')->first();
    }
}
