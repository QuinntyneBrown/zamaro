<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * You're approved: the next step is payout setup, and a new account chooses its password first
 * (L2-048.1, M3 D3).
 */
class ApplicationApprovedNotification extends TransactionalNotification
{
    public function __construct(
        private readonly string $applicantName,
        private readonly string $number,
        private readonly string $slug,
        /** The plain set-password token for a new account, or null when the applicant signs in already. */
        private readonly ?string $setPasswordToken,
    ) {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        $firstName = strtok(trim($this->applicantName), ' ') ?: $this->applicantName;
        $newAccount = $this->setPasswordToken !== null;

        return $this->email($this->copy('applicationApproved.subject', ['name' => $firstName]), 'application-approved', [
            'greeting' => $this->copy('applicationApproved.greeting', ['name' => $firstName]),
            'intro' => $this->copy('applicationApproved.intro', ['number' => $this->number, 'slug' => $this->slug]),
            'next' => $this->copy($newAccount ? 'applicationApproved.nextNewAccount' : 'applicationApproved.next'),
            'action' => $this->copy($newAccount ? 'applicationApproved.actionNewAccount' : 'applicationApproved.action'),
            'link' => $newAccount ? $this->webUrl('/reset-password/'.$this->setPasswordToken) : $this->webUrl('/dashboard'),
            'hidden' => $this->copy('applicationApproved.hidden'),
            'questions' => $this->copy('applicationApproved.questions', ['number' => $this->number]),
        ]);
    }
}
