<?php

namespace Tests\Feature\Security;

use App\Enums\ActType;
use App\Enums\ArtistStatus;
use App\Enums\Role;
use App\Models\Artist;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route as Router;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-074: every authenticated route checks role and ownership on the server. A booker on an
 * artist-only or admin-only route, and anyone asking for another user's resource, gets the same 404 as
 * an address that does not exist (security/authorise-and-validate-requests).
 */
class CrossUserAccessTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    /** @var array<int, string> session cookie by user ID */
    private array $sessions = [];

    public function test_every_authenticated_route_refuses_another_users_resource(): void
    {
        $fixtures = require __DIR__.'/route-ownership-fixtures.php';
        $routes = $this->authenticatedRoutes();
        $this->assertNotEmpty($routes);

        foreach ($routes as $route) {
            $this->assertArrayHasKey($route, $fixtures, "{$route} needs a case in route-ownership-fixtures.php (L2-074.3).");
            $this->sessions = [];

            $fixtures[$route]($this, $this->booker(), $this->booker());
        }
    }

    public function test_a_booker_on_an_artist_only_route_gets_the_same_404_as_an_unknown_address(): void
    {
        Router::middleware(['api', 'auth:sanctum', 'role:artist'])->get('api/v1/__artist-only', fn () => ['secret' => 'artist data']);
        $booker = $this->booker();

        $response = $this->as($booker)->getJson('/api/v1/__artist-only');

        $response->assertNotFound()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/not-found')
            ->assertJsonMissingPath('secret');
        $unknown = $this->as($booker)->getJson('/api/v1/__nothing-here');
        $this->assertSame($unknown->json('detail'), $response->json('detail'));
        $this->assertSame($unknown->json('title'), $response->json('title'));
    }

    public function test_an_artist_on_an_artist_only_route_gets_through(): void
    {
        Router::middleware(['api', 'auth:sanctum', 'role:artist'])->get('api/v1/__artist-only', fn () => ['ok' => true]);
        $artist = $this->booker();
        $artist->grantRoles([Role::Artist]);

        $this->as($artist)->getJson('/api/v1/__artist-only')->assertOk();
    }

    public function test_a_booker_on_an_admin_only_route_gets_404(): void
    {
        Router::middleware(['api', 'auth:sanctum', 'role:admin'])->get('api/v1/__admin-only', fn () => ['ok' => true]);

        $this->as($this->booker())->getJson('/api/v1/__admin-only')->assertNotFound();
    }

    /** The next request as this user, carrying their own session cookie. */
    public function as(User $user): static
    {
        if (! isset($this->sessions[$user->id])) {
            // Signed in from a browser holding no one else's cookie.
            $this->defaultCookies = [];
            $this->sessions[$user->id] = $this->asANewRequest()->signIn($user->email)->assertOk()
                ->getCookie('zamaro_session')->getValue();
        }

        return $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $this->sessions[$user->id]);
    }

    /** Makes a signed-up person an artist with a profile of their own, for `role:artist` routes. */
    public function makeArtist(User $user): Artist
    {
        $user->grantRoles([Role::Artist]);

        return Artist::create([
            'user_id' => $user->id, 'slug' => "artist-{$user->id}", 'ticket_number' => "ACT-9{$user->id}",
            'display_name' => $user->name, 'act_type' => ActType::Solo, 'base_city' => 'Brampton',
            'base_latitude' => 43.7315, 'base_longitude' => -79.7624, 'max_drive_km' => 80,
            'from_price_cents' => 50000, 'status' => ArtistStatus::Approved,
        ]);
    }

    /** The answer carries none of the owner's personal values. */
    public function assertHoldsNothingOf(User $owner, TestResponse $response): void
    {
        foreach ([$owner->email, $owner->name] as $value) {
            $this->assertStringNotContainsString($value, $response->getContent());
            $this->assertStringNotContainsString(trim(json_encode($value), '"'), $response->getContent());
        }
        $this->assertMatchesContract($response);
    }

    /** @return list<string> `METHOD uri` for every /api/v1 route that needs a signed-in user */
    private function authenticatedRoutes(): array
    {
        return collect(Router::getRoutes()->getRoutes())
            ->filter(fn (Route $route) => str_starts_with($route->uri(), 'api/v1/')
                && in_array('auth:sanctum', $route->gatherMiddleware(), true))
            ->flatMap(fn (Route $route) => collect($route->methods())
                ->reject(fn (string $method) => $method === 'HEAD')
                ->map(fn (string $method) => "{$method} {$route->uri()}"))
            ->values()
            ->all();
    }

    private function booker(): User
    {
        $user = User::factory()->create(['password' => Hash::make(config('zamaro.cast_password'))]);
        $user->grantRoles([Role::Booker]);

        return $user;
    }
}
