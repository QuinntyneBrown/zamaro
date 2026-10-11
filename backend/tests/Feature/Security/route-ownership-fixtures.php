<?php

use App\Models\User;
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
];
