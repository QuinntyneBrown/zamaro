<?php

use App\Models\Artist;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use PragmaRX\Google2FA\Google2FA;
use Tests\Feature\Security\CrossUserAccessTest;

/** A church the owner saves before the intruder tries the church routes. */
$ownerChurch = [
    'name' => 'Owner Community Church', 'streetAddress' => '2150 Lakeshore Road', 'city' => 'Burlington',
    'postalCode' => 'L7R 1A3', 'phone' => '905-555-0111',
];

/*
 * One case per authenticated route (`METHOD uri`), proving that the intruder, another signed-in user,
 * gets nothing of the owner's (L2-074.2, L2-074.3). CrossUserAccessTest fails for a route with no case,
 * so every new authenticated route ships with its case in the same commit.
 *
 * A route that names a resource asks for the owner's identifier as the intruder and expects the
 * concealing 404. A route with no identifier acts on the caller alone: the intruder's answer holds none
 * of the owner's values, and the owner is unaffected.
 */
return [
    'GET api/v1/me' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $response = $test->as($intruder)->getJson('/api/v1/me')->assertOk();

        $test->assertHoldsNothingOf($owner, $response);
    },

    'PATCH api/v1/me/preferences' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($owner)->patchJson('/api/v1/me/preferences', ['themePreference' => 'light'])->assertOk();

        $test->as($intruder)->patchJson('/api/v1/me/preferences', ['themePreference' => 'dark'])->assertOk()->assertJsonPath('data.email', $intruder->email);

        $test->as($owner)->getJson('/api/v1/me')->assertJsonPath('data.themePreference', 'light');
    },

    'DELETE api/v1/session' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->deleteJson('/api/v1/session')->assertNoContent();

        $test->as($owner)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.email', $owner->email);
    },

    'PUT api/v1/account/profile' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->putJson('/api/v1/account/profile', ['name' => 'Intruder Name'])->assertOk();

        $test->as($owner)->getJson('/api/v1/me')->assertJsonPath('data.name', $owner->name);
    },

    'GET api/v1/account/church' => function (CrossUserAccessTest $test, User $owner, User $intruder) use ($ownerChurch): void {
        $test->as($owner)->putJson('/api/v1/account/church', $ownerChurch)->assertOk();

        $response = $test->as($intruder)->getJson('/api/v1/account/church')->assertOk()->assertExactJson(['data' => null]);

        $test->assertStringNotContainsString('Owner Community Church', $response->getContent());
    },

    'PUT api/v1/account/church' => function (CrossUserAccessTest $test, User $owner, User $intruder) use ($ownerChurch): void {
        $test->as($owner)->putJson('/api/v1/account/church', $ownerChurch)->assertOk();

        $test->as($intruder)->putJson('/api/v1/account/church', [...$ownerChurch, 'name' => 'Intruder Chapel', 'phone' => '905-555-0999'])->assertOk();

        $test->as($owner)->getJson('/api/v1/account/church')
            ->assertJsonPath('data.name', 'Owner Community Church')
            ->assertJsonPath('data.phone', '905-555-0111');
    },

    'GET api/v1/account/contact-phone' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->makeArtist($owner)->update(['contact_phone' => '+19055550111']);
        $test->makeArtist($intruder);

        $response = $test->as($intruder)->getJson('/api/v1/account/contact-phone')->assertOk()->assertJsonPath('data.contactPhone', null);

        $test->assertStringNotContainsString('0111', $response->getContent());
    },

    'PUT api/v1/account/contact-phone' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->makeArtist($owner)->update(['contact_phone' => '+19055550111']);
        $test->makeArtist($intruder);

        $test->as($intruder)->putJson('/api/v1/account/contact-phone', ['contactPhone' => '905-555-0999'])->assertOk();

        $test->as($owner)->getJson('/api/v1/account/contact-phone')->assertJsonPath('data.contactPhone', '905-555-0111');
    },

    'PUT api/v1/account/email' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->putJson('/api/v1/account/email', [
            'email' => 'intruder-new@example.ca', 'currentPassword' => config('zamaro.cast_password'),
        ])->assertStatus(202);

        $test->as($owner)->getJson('/api/v1/me')
            ->assertJsonPath('data.email', $owner->email)
            ->assertJsonPath('data.pendingEmail', null);
    },

    'PUT api/v1/account/password' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($owner)->getJson('/api/v1/me')->assertOk();

        $test->as($intruder)->putJson('/api/v1/account/password', [
            'currentPassword' => config('zamaro.cast_password'),
            'password' => 'a-song-of-ascents-121',
            'passwordConfirmation' => 'a-song-of-ascents-121',
        ])->assertNoContent();

        $test->as($owner)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.email', $owner->email);
    },

    'GET api/v1/account/sessions' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($owner)->getJson('/api/v1/me')->assertOk();

        $response = $test->as($intruder)->getJson('/api/v1/account/sessions')->assertOk()->assertJsonCount(1, 'data');

        $test->assertHoldsNothingOf($owner, $response);
    },

    'DELETE api/v1/account/sessions/{session}' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $ownerSession = $test->as($owner)->getJson('/api/v1/account/sessions')->json('data.0.id');

        $test->as($intruder)->deleteJson("/api/v1/account/sessions/{$ownerSession}")->assertNotFound();

        $test->as($owner)->getJson('/api/v1/me')->assertOk();
    },

    'POST api/v1/account/two-factor' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $ownerKey = $test->as($owner)->postJson('/api/v1/account/two-factor')->assertOk()->json('data.key');

        $intruderKey = $test->as($intruder)->postJson('/api/v1/account/two-factor')->assertOk()->json('data.key');

        $test->assertNotSame($ownerKey, $intruderKey);
        $test->as($owner)->getJson('/api/v1/me')->assertJsonPath('data.mfaEnabled', false);
    },

    'GET api/v1/account/two-factor/qr' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($owner)->postJson('/api/v1/account/two-factor')->assertOk();

        $test->as($intruder)->get('/api/v1/account/two-factor/qr')->assertNotFound();
    },

    'POST api/v1/account/two-factor/confirm' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $key = str_replace(' ', '', $test->as($owner)->postJson('/api/v1/account/two-factor')->json('data.key'));

        $test->as($intruder)->postJson('/api/v1/account/two-factor/confirm', [
            'code' => (new Google2FA)->getCurrentOtp($key),
        ])->assertUnprocessable();

        $test->as($owner)->getJson('/api/v1/me')->assertJsonPath('data.mfaEnabled', false);
    },

    'DELETE api/v1/account/two-factor' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $key = str_replace(' ', '', $test->as($owner)->postJson('/api/v1/account/two-factor')->json('data.key'));
        $test->as($owner)->postJson('/api/v1/account/two-factor/confirm', ['code' => (new Google2FA)->getCurrentOtp($key)])->assertOk();

        $test->as($intruder)->deleteJson('/api/v1/account/two-factor', ['code' => (new Google2FA)->getCurrentOtp($key)])->assertNotFound();

        $test->as($owner)->getJson('/api/v1/me')->assertJsonPath('data.mfaEnabled', true);
    },

    'POST api/v1/account/two-factor/recovery-codes' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $key = str_replace(' ', '', $test->as($owner)->postJson('/api/v1/account/two-factor')->json('data.key'));
        $codes = $test->as($owner)->postJson('/api/v1/account/two-factor/confirm', ['code' => (new Google2FA)->getCurrentOtp($key)])->json('data.recoveryCodes');

        $test->as($intruder)->postJson('/api/v1/account/two-factor/recovery-codes', ['code' => $codes[0]])->assertNotFound();

        $test->as($owner)->deleteJson('/api/v1/account/two-factor', ['code' => $codes[0]])->assertNoContent();
    },

    'POST api/v1/account/consents/terms' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->postJson('/api/v1/account/consents/terms', ['termsVersion' => 'none'])->assertStatus(404);

        $test->as($owner)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.email', $owner->email);
    },

    'GET api/v1/account/consents/marketing' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($owner)->postJson('/api/v1/account/consents/marketing', ['granted' => true])->assertOk();

        $test->as($intruder)->getJson('/api/v1/account/consents/marketing')->assertOk()->assertJsonPath('data.granted', false);
    },

    'POST api/v1/account/consents/marketing' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->postJson('/api/v1/account/consents/marketing', ['granted' => true])->assertOk();

        $test->as($owner)->getJson('/api/v1/account/consents/marketing')->assertJsonPath('data.granted', false);
    },

    'GET api/v1/saved-artists/ids' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $artist = Artist::where('status', 'approved')->value('id') ?? $test->makeArtist(User::factory()->create())->id;
        $test->as($owner)->putJson("/api/v1/saved-artists/{$artist}")->assertOk();

        $test->as($intruder)->getJson('/api/v1/saved-artists/ids')->assertOk()->assertJsonPath('data.count', 0);
    },

    'GET api/v1/saved-artists' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $artist = $test->makeArtist(User::factory()->create())->id;
        $test->as($owner)->putJson("/api/v1/saved-artists/{$artist}")->assertOk();

        $test->as($intruder)->getJson('/api/v1/saved-artists')->assertOk()->assertJsonPath('data.total', 0)->assertJsonPath('data.artists', []);
    },

    'PUT api/v1/saved-artists/{artist}' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $artist = $test->makeArtist(User::factory()->create())->id;
        $test->as($owner)->putJson("/api/v1/saved-artists/{$artist}")->assertOk();

        $test->as($intruder)->putJson("/api/v1/saved-artists/{$artist}")->assertOk()->assertJsonPath('data.savedCount', 1);

        $test->as($owner)->getJson('/api/v1/saved-artists/ids')->assertJsonPath('data.count', 1);
    },

    'DELETE api/v1/saved-artists/{artist}' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $artist = $test->makeArtist(User::factory()->create())->id;
        $test->as($owner)->putJson("/api/v1/saved-artists/{$artist}")->assertOk();

        $test->as($intruder)->deleteJson("/api/v1/saved-artists/{$artist}")->assertOk()->assertJsonPath('data.savedCount', 0);

        $test->as($owner)->getJson('/api/v1/saved-artists/ids')->assertJsonPath('data.artistIds', [$artist]);
    },

    // The admin API conceals itself from everyone but an administrator who signed in with a code
    // (L2-066.1); AdminRoutesConcealedTest proves the body matches an unknown address.
    'GET api/v1/admin/overview' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/overview')->assertNotFound()
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/not-found');
    },

    'GET api/v1/admin/audit-entries' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/audit-entries')->assertNotFound()
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/not-found');
    },

    'GET api/v1/admin/audit-entries/{entry}' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/audit-entries/1')->assertNotFound()
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/not-found');
    },

    'POST api/v1/artist/vulnerable-sector-checks' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->makeArtist($owner);

        // A booker: the artist-only route is concealed (L2-074.1).
        $test->as($intruder)->post('/api/v1/artist/vulnerable-sector-checks', [], ['Accept' => 'application/json'])->assertNotFound();
    },

    'GET api/v1/artist/vulnerable-sector-checks/current' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->makeArtist($owner);
        $test->makeArtist($intruder);
        DB::table('vulnerable_sector_checks')->insert([
            'user_id' => $owner->id, 'issued_on' => '2025-03-03', 'expires_on' => '2028-03-03', 'status' => 'verified',
            'verified_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);

        $response = $test->as($intruder)->getJson('/api/v1/artist/vulnerable-sector-checks/current')->assertOk()
            ->assertJsonPath('data.verified', null)->assertJsonPath('data.latest', null);

        $test->assertHoldsNothingOf($owner, $response);
    },

    'GET api/v1/vulnerable-sector-checks/{check}/document-link' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->makeArtist($owner);
        $check = DB::table('vulnerable_sector_checks')->insertGetId([
            'user_id' => $owner->id, 'issued_on' => '2026-10-05', 'status' => 'pending', 'storage_key' => str_repeat('a', 32),
            'wrapped_data_key' => 'v1:none', 'mime_type' => 'application/pdf', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $test->as($intruder)->getJson("/api/v1/vulnerable-sector-checks/{$check}/document-link")->assertNotFound()
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/not-found');
    },

    // The admin routes conceal themselves from everyone but an administrator who signed in with a code
    // (L2-066.1); AdminRoutesConcealedTest proves the body matches an unknown address.
    'GET api/v1/admin/vulnerable-sector-checks' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/vulnerable-sector-checks')->assertNotFound();
    },

    'POST api/v1/admin/vulnerable-sector-checks/{check}/verification' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->postJson('/api/v1/admin/vulnerable-sector-checks/1/verification')->assertNotFound();
    },

    'GET api/v1/admin/vulnerable-sector-checks/{check}/document-link' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/vulnerable-sector-checks/1/document-link')->assertNotFound();
    },

    'GET api/v1/admin/artist-applications' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/artist-applications')->assertNotFound();
    },

    'GET api/v1/admin/artist-applications/{application}' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/artist-applications/1')->assertNotFound();
    },

    'PUT api/v1/admin/artist-applications/{application}/references/{reference}/verification' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->putJson('/api/v1/admin/artist-applications/1/references/1/verification', ['verified' => true])->assertNotFound();
    },

    'POST api/v1/admin/artist-applications/{application}/approval' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->postJson('/api/v1/admin/artist-applications/1/approval')->assertNotFound();
    },

    'POST api/v1/admin/artist-applications/{application}/rejection' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->postJson('/api/v1/admin/artist-applications/1/rejection', ['reason' => 'other'])->assertNotFound();
    },

    'GET api/v1/admin/artists' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/artists')->assertNotFound();
    },

    'GET api/v1/admin/artists/{artist}' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->getJson('/api/v1/admin/artists/1')->assertNotFound();
    },
];
