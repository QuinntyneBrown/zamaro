<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/** Told to the address an account signs in with when a new one is asked for (L2-025.1). */
class EmailChangeRequestedNotification extends TransactionalNotification
{
    public function __construct(private readonly string $newEmail)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->email($this->copy('emailChanging.subject'), 'email-changing', [
            'greeting' => $this->copy('emailChanging.greeting', ['name' => $this->firstName($notifiable)]),
            'intro' => $this->copy('emailChanging.intro', ['email' => $this->newEmail]),
            'stays' => $this->copy('emailChanging.stays', ['email' => $notifiable->email]),
            'notYou' => $this->copy('emailChanging.notYou'),
            'action' => $this->copy('emailChanging.action'),
            'link' => $this->webUrl('/forgot-password'),
        ]);
    }
}
