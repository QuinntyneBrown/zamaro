<?php

namespace App\Listeners\Operations;

use App\Contracts\Alert;
use App\Contracts\ErrorReporter;
use App\Contracts\OnCallAlerter;
use App\Enums\AlertSeverity;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Context;

/**
 * A job that exhausted its attempts (L2-092.1, operations/run-background-jobs). The worker has stored it
 * in `failed_jobs`; this reports the exception and pages the on-call person, who re-runs it with
 * `queue:retry` once the cause is fixed. The request ID is the one that queued the job, carried in its
 * payload by Laravel's Context.
 */
class ReportFailedJob
{
    public function __construct(private readonly ErrorReporter $errors, private readonly OnCallAlerter $alerter) {}

    public function handle(JobFailed $event): void
    {
        $job = $event->job->resolveName();
        $attempts = $event->job->attempts();
        $requestId = Context::get('request_id');
        $context = ['job' => $job, 'queue' => $event->job->getQueue(), 'attempts' => $attempts];

        $this->errors->report($event->exception, $requestId, (string) config('zamaro.release'), $context);
        $this->alerter->raise(new Alert(
            'job-failed',
            "{$job} failed after {$attempts} attempts (request ".($requestId ?? 'none').')',
            AlertSeverity::Critical,
            [...$context, 'requestId' => $requestId],
        ));
    }
}
