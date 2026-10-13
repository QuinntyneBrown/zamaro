<?php

namespace App\Console\Commands;

use App\Services\UserExperience\Catalogue;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * L2-111.1 for emails (user-experience/localise-formats-and-text): every word an email shows comes from
 * the catalogue (ADR-0019). Fails, with the file and line, on text written into an email view, on a
 * literal passed to a MailMessage text method in a notification class, and on a catalogue key the
 * English catalogue lacks. Frontend text has its own check, the `zamaro/no-hardcoded-text` ESLint rule.
 */
class CheckTranslationsCommand extends Command
{
    protected $signature = 'i18n:check';

    protected $description = 'Fail on hard-coded text or missing catalogue keys in the email views and notification classes';

    /** Blade that prints or arranges but holds no words of its own; masked before looking for letters. */
    private const NOT_TEXT = [
        '/\{\{--.*?--\}\}/s',  // comments
        '/\{!!.*?!!\}/s',      // raw echoes
        '/\{\{.*?\}\}/s',      // echoes
        '/<[^>]*>/s',          // HTML and mail component tags, with their attributes
        '/@\w+(?:\s*\((?:[^()]|\([^()]*\))*\))?/', // directives
        '/&#?\w+;/',           // entities
    ];

    /** Literals passed to the MailMessage methods that show text, or as the subject of `email()`. */
    private const LITERAL_TEXT = '/(?:->(?:subject|greeting|line|lines|action|salutation|error)|\$this->email)\(\s*([\'"])((?:(?!\1).)*)\1/';

    /** Catalogue keys: `copy()` reads the `emails` namespace; `message()` and `@t` take the full key. */
    private const KEYS = [
        'emails.' => '/->copy\(\s*\'([^\']+)\'/',
        '' => '/(?:(?:->|::)message\(|@t\()\s*\'([^\']+)\'/',
    ];

    public function handle(Catalogue $catalogue): int
    {
        $views = $this->files(config('zamaro.i18n.check.email_views'), '.blade.php');
        $classes = $this->files(config('zamaro.i18n.check.notifications'), '.php');
        $messages = $catalogue->messages(Catalogue::FALLBACK);

        $problems = [];
        foreach ($views as $path) {
            $problems = [...$problems, ...$this->textInView($path), ...$this->missingKeys($path, $messages)];
        }
        foreach ($classes as $path) {
            $problems = [...$problems, ...$this->textInClass($path), ...$this->missingKeys($path, $messages)];
        }

        if ($problems === []) {
            $this->info(sprintf('No hard-coded text and no missing keys in %d email views and %d notification classes.', count($views), count($classes)));

            return self::SUCCESS;
        }
        foreach ($problems as $problem) {
            $this->error($problem);
        }

        return self::FAILURE;
    }

    /** @return list<string> */
    private function textInView(string $path): array
    {
        $masked = File::get($path);
        foreach (self::NOT_TEXT as $pattern) {
            // Same length, newlines kept, so line numbers still match the file.
            $masked = preg_replace_callback($pattern, fn (array $m) => preg_replace('/[^\n]/', ' ', $m[0]), $masked);
        }

        $problems = [];
        foreach (explode("\n", $masked) as $i => $line) {
            if (preg_match('/\p{L}/u', $line) === 1) {
                $problems[] = sprintf('%s:%d  hard-coded text "%s"', $this->name($path), $i + 1, trim($line));
            }
        }

        return $problems;
    }

    /** @return list<string> */
    private function textInClass(string $path): array
    {
        $source = File::get($path);
        preg_match_all(self::LITERAL_TEXT, $source, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);

        $problems = [];
        foreach ($matches as $match) {
            if (preg_match('/\p{L}/u', $match[2][0]) === 1) {
                $problems[] = sprintf('%s:%d  hard-coded text "%s"', $this->name($path), $this->lineOf($source, $match[2][1]), $match[2][0]);
            }
        }

        return $problems;
    }

    /**
     * @param  array<string, string>  $messages
     * @return list<string>
     */
    private function missingKeys(string $path, array $messages): array
    {
        $source = File::get($path);

        $problems = [];
        foreach (self::KEYS as $namespace => $pattern) {
            preg_match_all($pattern, $source, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
            foreach ($matches as $match) {
                $key = $namespace.$match[1][0];
                if (! array_key_exists($key, $messages)) {
                    $problems[] = sprintf('%s:%d  missing key %s', $this->name($path), $this->lineOf($source, $match[1][1]), $key);
                }
            }
        }

        return $problems;
    }

    /** @return list<string> */
    private function files(string $dir, string $suffix): array
    {
        if (! is_dir($dir)) {
            return [];
        }
        $paths = array_map(fn ($file) => $file->getPathname(), File::allFiles($dir));
        sort($paths);

        return array_values(array_filter($paths, fn (string $path) => str_ends_with($path, $suffix)));
    }

    private function lineOf(string $source, int $offset): int
    {
        return substr_count($source, "\n", 0, $offset) + 1;
    }

    /** Relative to the app, for files in it. */
    private function name(string $path): string
    {
        return Str::startsWith($path, base_path().'/') ? Str::after($path, base_path().'/') : $path;
    }
}
