<?php

namespace App\Notifications;

use App\Services\UserExperience\Catalogue;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Every Zamaro email (notifications/send-transactional-emails, ADR-0019): queued on `notifications`
 * once the transaction that raised it commits, sent from Zamaro <hello@zamaro.ca> (D16) as Markdown
 * mail with HTML and text parts, every word from the `emails` catalogue (L2-111). Retries and failure
 * reporting join in M2 S6.
 */
abstract class TransactionalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('notifications');
        $this->afterCommit();
    }

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    abstract public function toMail(object $notifiable): MailMessage;

    /**
     * An email built from one Markdown view in resources/views/emails, with the site's header and
     * footer.
     *
     * @param  array<string, mixed>  $data
     */
    protected function email(string $subject, string $view, array $data): MailMessage
    {
        return (new MailMessage)
            ->subject($subject)
            ->markdown("emails.{$view}", $data + ['webUrl' => $this->webUrl('/'), 'footer' => $this->copy('footer')]);
    }

    /** @param  array<string, mixed>  $params */
    protected function copy(string $key, array $params = []): string
    {
        return app(Catalogue::class)->message("emails.{$key}", $params);
    }

    /** An address on Zamaro Web; emails are sent with no request to take the origin from. */
    protected function webUrl(string $path): string
    {
        return config('zamaro.web_url').$path;
    }

    /** "Naomi" from "Naomi Fraser", for the greeting. */
    protected function firstName(object $notifiable): string
    {
        return strtok(trim($notifiable->name), ' ') ?: $notifiable->name;
    }
}
