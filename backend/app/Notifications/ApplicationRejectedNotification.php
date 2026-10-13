<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/** The application was not approved: the reason from the fixed list, and the team's note when there is one (L2-048.2). */
class ApplicationRejectedNotification extends TransactionalNotification
{
    public function __construct(
        private readonly string $applicantName,
        private readonly string $number,
        private readonly string $reason,
        private readonly ?string $note,
    ) {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        $firstName = strtok(trim($this->applicantName), ' ') ?: $this->applicantName;

        return $this->email($this->copy('applicationRejected.subject', ['number' => $this->number]), 'application-rejected', [
            'greeting' => $this->copy('applicationRejected.greeting', ['name' => $firstName]),
            'intro' => $this->copy('applicationRejected.intro', ['number' => $this->number]),
            'reason' => $this->copy('applicationRejected.reason', ['reason' => $this->reason]),
            'noteLead' => $this->note === null ? null : $this->copy('applicationRejected.noteLead'),
            'note' => $this->note,
            'again' => $this->copy('applicationRejected.again'),
            'action' => $this->copy('applicationRejected.action'),
            'link' => $this->webUrl('/artists/apply'),
            'questions' => $this->copy('applicationRejected.questions', ['number' => $this->number]),
        ]);
    }
}
