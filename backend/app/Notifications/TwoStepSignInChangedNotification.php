<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/** Two-step sign-in was turned on or off, or its recovery codes replaced (M2 D21). */
class TwoStepSignInChangedNotification extends TransactionalNotification
{
    public const ON = 'on';

    public const OFF = 'off';

    public const NEW_CODES = 'codes';

    public function __construct(private readonly string $change)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        $key = "twoStep.{$this->change}";

        return $this->email($this->copy("{$key}.subject"), 'two-step-changed', [
            'greeting' => $this->copy('twoStep.greeting', ['name' => $this->firstName($notifiable)]),
            'intro' => $this->copy("{$key}.intro", ['email' => $notifiable->email]),
            'notYou' => $this->copy('twoStep.notYou'),
            'action' => $this->copy('twoStep.action'),
            'link' => $this->webUrl('/forgot-password'),
        ]);
    }
}
