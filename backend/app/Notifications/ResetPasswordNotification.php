<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/** The reset link asked for on the forgot-password page (L2-023.3); it works once, for 60 minutes. */
class ResetPasswordNotification extends TransactionalNotification
{
    /** @param  string  $token  the plain token, never stored */
    public function __construct(private readonly string $token)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->email($this->copy('reset.subject'), 'reset-password', [
            'greeting' => $this->copy('reset.greeting', ['name' => $this->firstName($notifiable)]),
            'intro' => $this->copy('reset.intro', ['email' => $notifiable->email]),
            'action' => $this->copy('reset.action'),
            'link' => $this->webUrl('/reset-password/'.$this->token),
            'expiry' => $this->copy('reset.expiry'),
            'ignore' => $this->copy('reset.ignore'),
        ]);
    }
}
