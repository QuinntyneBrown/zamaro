<?php

namespace App\Listeners\ArtistOnboarding;

use App\Enums\ApplicationRejectionReason;
use App\Events\ArtistApplicationApproved;
use App\Events\ArtistApplicationRejected;
use App\Models\ArtistApplication;
use App\Notifications\ApplicationApprovedNotification;
use App\Notifications\ApplicationRejectedNotification;
use Illuminate\Support\Facades\Notification;

/**
 * Emails the applicant the decision within 2 minutes (L2-048, L2-063): the next step after an approval,
 * the reason and note after a rejection. The address is the application's, so it reaches an applicant
 * with no account too.
 */
class SendApplicationDecisionEmail
{
    public function handleApproved(ArtistApplicationApproved $event): void
    {
        $application = ArtistApplication::with('artist')->find($event->applicationId);
        if ($application === null || $application->artist === null) {
            return;
        }
        Notification::route('mail', $application->email)->notify(new ApplicationApprovedNotification(
            $application->name,
            $application->number,
            $application->artist->slug,
            $event->setPasswordToken,
        ));
    }

    public function handleRejected(ArtistApplicationRejected $event): void
    {
        $application = ArtistApplication::find($event->applicationId);
        if ($application === null || $application->rejection_reason === null) {
            return;
        }
        Notification::route('mail', $application->email)->notify(new ApplicationRejectedNotification(
            $application->name,
            $application->number,
            ApplicationRejectionReason::from($application->rejection_reason)->label(),
            $application->rejection_note,
        ));
    }
}
