<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * The artist's verified Vulnerable Sector Check runs out within 60 days: renew it from the profile
 * editor's check section to stay in Youth event searches (L2-049.3).
 */
class VscRenewalReminderNotification extends TransactionalNotification
{
    public function __construct(private readonly CarbonInterface $expiresOn)
    {
        parent::__construct();
    }

    public function toMail(object $notifiable): MailMessage
    {
        $date = $this->expiresOn->format('D j M Y');

        return $this->email($this->copy('vscRenewal.subject', ['date' => $date]), 'vsc-renewal', [
            'greeting' => $this->copy('vscRenewal.greeting', ['name' => $this->firstName($notifiable)]),
            'intro' => $this->copy('vscRenewal.intro', ['date' => $date]),
            'renewBy' => $this->copy('vscRenewal.renewBy', ['date' => $date]),
            'action' => $this->copy('vscRenewal.action'),
            'link' => $this->webUrl('/artist/profile#check'),
            'after' => $this->copy('vscRenewal.after'),
        ]);
    }
}
