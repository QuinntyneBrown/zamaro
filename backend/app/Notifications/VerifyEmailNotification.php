<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/** The verification link sent at registration (L2-022.1); it works once, for 24 hours. */
class VerifyEmailNotification extends TransactionalNotification
{
    /** @param  string  $token  the plain token, never stored */
    public function __construct(private readonly string $token, private readonly string $returnUrl)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->email($this->copy('verify.subject'), 'verify-email', [
            'greeting' => $this->copy('verify.greeting', ['name' => $this->firstName($notifiable)]),
            'intro' => $this->copy('verify.intro'),
            'action' => $this->copy('verify.action'),
            'link' => $this->webUrl('/verify-email?'.http_build_query(['token' => $this->token, 'returnUrl' => $this->returnUrl])),
            'expiry' => $this->copy('verify.expiry'),
            'ignore' => $this->copy('verify.ignore'),
        ]);
    }
}
