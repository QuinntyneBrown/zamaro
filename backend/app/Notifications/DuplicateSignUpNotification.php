<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Notifications\Messages\MailMessage;

/** Someone registered with an address that already has an account; its owner is told (L2-022.2). */
class DuplicateSignUpNotification extends TransactionalNotification
{
    public function __construct(private readonly CarbonInterface $attemptedAt)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->email($this->copy('duplicate.subject'), 'duplicate-sign-up', [
            'greeting' => $this->copy('duplicate.greeting', ['name' => $this->firstName($notifiable)]),
            'intro' => $this->copy('duplicate.intro', [
                'email' => $notifiable->email,
                // en-CA dates as the site writes them: "Fri 9 Oct 2026" (L2-110).
                'date' => $this->attemptedAt->setTimezone(config('app.timezone'))->format('D j M Y'),
            ]),
            'signIn' => $this->copy('duplicate.signIn'),
            'action' => $this->copy('duplicate.action'),
            'link' => $this->webUrl('/sign-in'),
            'forgot' => $this->copy('duplicate.forgot'),
            'forgotAction' => $this->copy('duplicate.forgotAction'),
            'forgotLink' => $this->webUrl('/forgot-password'),
            'ignore' => $this->copy('duplicate.ignore'),
        ]);
    }
}
