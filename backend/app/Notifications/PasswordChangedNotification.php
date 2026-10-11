<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Notifications\Messages\MailMessage;

/** The account's password was reset, and every other session ended (L2-023.4). */
class PasswordChangedNotification extends TransactionalNotification
{
    public function __construct(private readonly CarbonInterface $changedAt)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->email($this->copy('passwordChanged.subject'), 'password-changed', [
            'greeting' => $this->copy('passwordChanged.greeting', ['name' => $this->firstName($notifiable)]),
            'intro' => $this->copy('passwordChanged.intro', [
                'email' => $notifiable->email,
                'date' => $this->changedAt->setTimezone(config('app.timezone'))->format('D j M Y'),
                'time' => $this->time($this->changedAt),
            ]),
            'notYou' => $this->copy('passwordChanged.notYou'),
            'action' => $this->copy('passwordChanged.action'),
            'link' => $this->webUrl('/forgot-password'),
        ]);
    }
}
