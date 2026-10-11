<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/** The link that moves an account to a new address (L2-025.1), sent to that address; 24 hours, once. */
class ConfirmNewEmailNotification extends TransactionalNotification
{
    /** @param  string  $token  the plain token, never stored */
    public function __construct(private readonly string $token, private readonly string $name)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->email($this->copy('confirmEmail.subject'), 'confirm-new-email', [
            'greeting' => $this->copy('confirmEmail.greeting', ['name' => strtok(trim($this->name), ' ') ?: $this->name]),
            'intro' => $this->copy('confirmEmail.intro'),
            'action' => $this->copy('confirmEmail.action'),
            'link' => $this->webUrl('/account/email/confirm?token='.$this->token),
            'expiry' => $this->copy('confirmEmail.expiry'),
            'ignore' => $this->copy('confirmEmail.ignore'),
        ]);
    }
}
