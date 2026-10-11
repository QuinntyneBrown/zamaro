<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Notifications\Messages\MailMessage;

/** Sign-in for the account's address is paused after 5 failures; the owner is told once (L2-072.4). */
class AccountLockedNotification extends TransactionalNotification
{
    public function __construct(private readonly CarbonInterface $pausedUntil)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->email($this->copy('locked.subject'), 'account-locked', [
            'greeting' => $this->copy('locked.greeting', ['name' => $this->firstName($notifiable)]),
            'intro' => $this->copy('locked.intro', [
                'email' => $notifiable->email,
                'time' => $this->time($this->pausedUntil),
            ]),
            'wasYou' => $this->copy('locked.wasYou'),
            'action' => $this->copy('locked.action'),
            'link' => $this->webUrl('/forgot-password'),
            'notYou' => $this->copy('locked.notYou'),
        ]);
    }
}
