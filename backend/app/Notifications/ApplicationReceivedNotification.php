<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Notifications\Messages\MailMessage;

/** The application is in: its number, what happens next and when a reply comes (L2-047.1, L2-063). */
class ApplicationReceivedNotification extends TransactionalNotification
{
    public const REPLY_DAYS = 3;

    public function __construct(
        private readonly string $applicantName,
        private readonly string $number,
        private readonly CarbonInterface $replyBy,
    ) {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        $replyBy = $this->replyBy->format('D j M');

        return $this->email($this->copy('applicationReceived.subject', ['number' => $this->number]), 'application-received', [
            'greeting' => $this->copy('applicationReceived.greeting', ['name' => strtok(trim($this->applicantName), ' ') ?: $this->applicantName]),
            'intro' => $this->copy('applicationReceived.intro', ['number' => $this->number, 'replyBy' => $replyBy]),
            'next' => $this->copy('applicationReceived.next'),
            'action' => $this->copy('applicationReceived.action'),
            'link' => $this->webUrl('/'),
            'questions' => $this->copy('applicationReceived.questions', ['number' => $this->number]),
        ]);
    }
}
