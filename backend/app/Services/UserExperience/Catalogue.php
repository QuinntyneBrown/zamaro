<?php

namespace App\Services\UserExperience;

use InvalidArgumentException;
use MessageFormatter;

/**
 * Translation catalogues in resources/i18n/{locale}/{namespace}.json. A locale exists when its directory
 * does; English is complete and every other locale falls back to it per key (L2-111.2).
 */
class Catalogue
{
    public const FALLBACK = 'en';

    public function has(string $locale): bool
    {
        return preg_match('/^[a-z]{2}(-[A-Z]{2})?$/', $locale) === 1 && is_dir($this->path($locale));
    }

    /**
     * Every message for the locale, keyed `{namespace}.{key}`.
     *
     * @return array<string, string>
     */
    public function messages(string $locale): array
    {
        $messages = $this->load(self::FALLBACK);
        if ($locale !== self::FALLBACK) {
            $messages = array_replace($messages, $this->load($locale));
        }
        ksort($messages);

        return $messages;
    }

    /**
     * One ICU message, formatted: what the server writes itself, such as an email (L2-111.1).
     *
     * @param  array<string, mixed>  $params
     */
    public function message(string $key, array $params = [], string $locale = self::FALLBACK): string
    {
        $pattern = $this->messages($locale)[$key] ?? throw new InvalidArgumentException("No message {$key} in the catalogue.");
        $message = MessageFormatter::formatMessage($locale, $pattern, $params);

        return $message === false ? throw new InvalidArgumentException("The message {$key} does not format.") : $message;
    }

    /**
     * @return array<string, string>
     */
    private function load(string $locale): array
    {
        $messages = [];
        foreach (glob($this->path($locale).'/*.json') ?: [] as $file) {
            $namespace = basename($file, '.json');
            foreach (json_decode(file_get_contents($file), true, flags: JSON_THROW_ON_ERROR) as $key => $message) {
                $messages["{$namespace}.{$key}"] = $message;
            }
        }

        return $messages;
    }

    private function path(string $locale): string
    {
        return rtrim(config('zamaro.i18n.path'), '/').'/'.$locale;
    }
}
