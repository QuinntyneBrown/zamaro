<?php

namespace Tests\Feature\UserExperience;

use Illuminate\Support\Facades\File;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-111.2: a new locale needs a catalogue, not a code change. The catalogue is cacheable (ETag / 304).
 */
class TranslationCatalogueTest extends TestCase
{
    use AssertsOpenApiContract;

    private ?string $catalogueDir = null;

    protected function tearDown(): void
    {
        if ($this->catalogueDir !== null) {
            File::deleteDirectory($this->catalogueDir);
        }
        parent::tearDown();
    }

    public function test_the_english_catalogue_is_served_with_a_strong_etag(): void
    {
        $response = $this->getJson('/api/v1/i18n/en');

        $response->assertOk()
            ->assertJsonPath('data.locale', 'en')
            ->assertJsonPath('data.messages', fn (array $messages) => $messages['common.nav.discover'] === 'Discover');
        $this->assertMatchesRegularExpression('/^"[a-f0-9]{64}"$/', $response->headers->get('ETag'));
        $this->assertStringContainsString('public', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_a_matching_if_none_match_returns_304_without_a_body(): void
    {
        $etag = $this->getJson('/api/v1/i18n/en')->headers->get('ETag');

        $response = $this->getJson('/api/v1/i18n/en', ['If-None-Match' => $etag]);

        $response->assertStatus(304);
        $this->assertSame('', $response->getContent());
    }

    public function test_a_partial_french_catalogue_falls_back_to_english_per_key(): void
    {
        $this->useCatalogue([
            'en' => ['common' => ['nav.discover' => 'Discover', 'nav.how' => 'How booking works']],
            'fr' => ['common' => ['nav.discover' => 'Découvrir']],
        ]);

        $this->getJson('/api/v1/i18n/fr')
            ->assertOk()
            ->assertJsonPath('data.locale', 'fr')
            ->assertJsonPath('data.messages', [
                'common.nav.discover' => 'Découvrir',
                'common.nav.how' => 'How booking works',
            ]);
    }

    public function test_a_locale_without_a_catalogue_returns_a_404_problem(): void
    {
        $response = $this->getJson('/api/v1/i18n/xx');

        $response->assertNotFound()->assertHeader('Content-Type', 'application/problem+json');
        $this->assertMatchesContract($response);
    }

    /**
     * @param  array<string, array<string, array<string, string>>>  $locales  locale => namespace => messages
     */
    private function useCatalogue(array $locales): void
    {
        $this->catalogueDir = sys_get_temp_dir().'/zamaro-i18n-'.uniqid();
        foreach ($locales as $locale => $namespaces) {
            foreach ($namespaces as $namespace => $messages) {
                File::ensureDirectoryExists("{$this->catalogueDir}/{$locale}");
                File::put("{$this->catalogueDir}/{$locale}/{$namespace}.json", json_encode($messages));
            }
        }
        config(['zamaro.i18n.path' => $this->catalogueDir]);
    }
}
