<?php

namespace App\Listeners\ArtistOnboarding;

use App\Events\ArtistApplicationSubmitted;
use App\Models\ArtistApplication;
use App\Notifications\ApplicationReceivedNotification;
use App\Services\ArtistOnboarding\BusinessDayCalendar;
use Illuminate\Support\Facades\Notification;

/**
 * Emails the applicant their number and reply-by date within 2 minutes of sending (L2-063.1). The
 * applicant may have no account, so the mail goes to the address they gave.
 */
class SendApplicationReceivedEmail
{
    public function __construct(private readonly BusinessDayCalendar $calendar) {}

    public function handle(ArtistApplicationSubmitted $event): void
    {
        $application = ArtistApplication::find($event->applicationId);
        if ($application === null) {
            return;
        }
        Notification::route('mail', $application->email)->notify(new ApplicationReceivedNotification(
            $application->name,
            $application->number,
            $this->calendar->businessDaysAfter($application->submitted_at, ApplicationReceivedNotification::REPLY_DAYS),
        ));
    }
}
