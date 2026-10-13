<?php

use App\Http\Controllers\Api\V1\Accounts\AccountEmailController;
use App\Http\Controllers\Api\V1\Accounts\AccountPasswordController;
use App\Http\Controllers\Api\V1\Accounts\AccountProfileController;
use App\Http\Controllers\Api\V1\Accounts\AccountSessionController;
use App\Http\Controllers\Api\V1\Accounts\ArtistContactController;
use App\Http\Controllers\Api\V1\Accounts\ChurchController;
use App\Http\Controllers\Api\V1\Accounts\MeController;
use App\Http\Controllers\Api\V1\Accounts\SavedArtistController;
use App\Http\Controllers\Api\V1\Accounts\SessionController;
use App\Http\Controllers\Api\V1\Accounts\TwoFactorController;
use App\Http\Controllers\Api\V1\Administration\AdminApplicationReferencesController;
use App\Http\Controllers\Api\V1\Administration\AdminArtistApplicationsController;
use App\Http\Controllers\Api\V1\Administration\AdminArtistsController;
use App\Http\Controllers\Api\V1\Administration\AdminOverviewController;
use App\Http\Controllers\Api\V1\Administration\AdminVulnerableSectorChecksController;
use App\Http\Controllers\Api\V1\Administration\AuditEntriesController;
use App\Http\Controllers\Api\V1\ArtistOnboarding\DocumentLinksController;
use App\Http\Controllers\Api\V1\ArtistOnboarding\VulnerableSectorChecksController;
use App\Http\Controllers\Api\V1\Privacy\ConsentController;
use App\Http\Middleware\EnsureAdministrator;
use App\Http\Middleware\EnsureCurrentTermsAccepted;
use App\Http\Middleware\EnsureMfaVerified;
use App\Http\Middleware\SetCachePolicy;
use App\Http\Middleware\TrackSessionActivity;
use Illuminate\Support\Facades\Route;

// /api/v1 routes that require a signed-in user. Anonymous routes belong in api_public.php.
// Everything here may hold personal data, so nothing here is cached (L2-089.3).

// Until the current terms are accepted, only /me, its theme, sign-out and the acceptance answer (L2-080.3).
Route::middleware(['auth:sanctum', SetCachePolicy::class, TrackSessionActivity::class, EnsureCurrentTermsAccepted::class])->group(function () {
    Route::get('me', [MeController::class, 'show'])->name('me.show');
    Route::patch('me/preferences', [MeController::class, 'updatePreferences'])->name('me.preferences');
    Route::delete('session', [SessionController::class, 'destroy'])->name('session.destroy');

    // Account settings (accounts/manage-account-settings, accounts/manage-church-profile).
    Route::put('account/profile', [AccountProfileController::class, 'update'])->name('account.profile.update');
    Route::put('account/email', [AccountEmailController::class, 'update'])->name('account.email.update');
    Route::put('account/password', [AccountPasswordController::class, 'update'])->name('account.password.update');
    Route::post('account/two-factor', [TwoFactorController::class, 'begin'])->name('account.two-factor.begin');
    Route::get('account/two-factor/qr', [TwoFactorController::class, 'qr'])->name('account.two-factor.qr');
    Route::post('account/two-factor/confirm', [TwoFactorController::class, 'confirm'])->name('account.two-factor.confirm');
    Route::delete('account/two-factor', [TwoFactorController::class, 'destroy'])->name('account.two-factor.destroy');
    Route::post('account/two-factor/recovery-codes', [TwoFactorController::class, 'recoveryCodes'])->name('account.two-factor.recovery-codes');
    Route::post('account/consents/terms', [ConsentController::class, 'acceptTerms'])->name('account.consents.terms');
    Route::get('account/consents/marketing', [ConsentController::class, 'marketing'])->name('account.consents.marketing');
    Route::post('account/consents/marketing', [ConsentController::class, 'saveMarketing'])->name('account.consents.marketing.save');
    Route::get('account/sessions', [AccountSessionController::class, 'index'])->name('account.sessions.index');
    Route::delete('account/sessions/{session}', [AccountSessionController::class, 'destroy'])->name('account.sessions.destroy');
    // The owner and administrators only; the policy conceals everything else (L2-049.4, L2-074.2).
    Route::get('vulnerable-sector-checks/{check}/document-link', [DocumentLinksController::class, 'show'])->whereNumber('check')->name('vulnerable-sector-checks.document-link');
    Route::middleware('role:booker')->group(function () {
        Route::get('account/church', [ChurchController::class, 'show'])->name('account.church.show');
        Route::put('account/church', [ChurchController::class, 'update'])->name('account.church.update');
    });
    Route::middleware('role:booker')->group(function () {
        Route::get('saved-artists', [SavedArtistController::class, 'index'])->name('saved-artists.index');
        Route::get('saved-artists/ids', [SavedArtistController::class, 'ids'])->name('saved-artists.ids');
        Route::put('saved-artists/{artist}', [SavedArtistController::class, 'update'])->whereNumber('artist')->name('saved-artists.update');
        Route::delete('saved-artists/{artist}', [SavedArtistController::class, 'destroy'])->whereNumber('artist')->name('saved-artists.destroy');
    });
    Route::middleware('role:artist')->group(function () {
        Route::get('account/contact-phone', [ArtistContactController::class, 'show'])->name('account.contact-phone.show');
        Route::put('account/contact-phone', [ArtistContactController::class, 'update'])->name('account.contact-phone.update');
        // The check is a multipart upload: a 32 MB hard cap, and the request's own 10 MB rule with its copy (L2-049.1).
        Route::post('artist/vulnerable-sector-checks', [VulnerableSectorChecksController::class, 'store'])->middleware('uploads:32768')->name('artist.vulnerable-sector-checks.store');
        Route::get('artist/vulnerable-sector-checks/current', [VulnerableSectorChecksController::class, 'current'])->name('artist.vulnerable-sector-checks.current');
    });
});

// The admin API (administration/secure-admin-access). EnsureAdministrator runs first, ahead of
// authentication, so a guest, a booker, an artist and an administrator who has given only their
// password all get the same 404 as an unknown address (L2-066.1, L2-074.1). The terms gate is not
// here: the admin application has no page to accept them on, and administrators are the Zamaro team.
Route::prefix('admin')->name('admin.')
    ->middleware([EnsureAdministrator::class, 'auth:sanctum', EnsureMfaVerified::class, SetCachePolicy::class, TrackSessionActivity::class])
    ->group(function () {
        Route::get('overview', [AdminOverviewController::class, 'show'])->name('overview');
        // The audit log is read only: no PATCH, PUT or DELETE route exists, so they answer 405 (L2-069.2).
        Route::get('audit-entries', [AuditEntriesController::class, 'index'])->name('audit-entries.index');
        Route::get('audit-entries/{entry}', [AuditEntriesController::class, 'show'])->whereNumber('entry')->name('audit-entries.show');
        // The Vulnerable Sector Check queue (L2-049.2) and the read-only Artists section (L2-067, M3 D18).
        Route::get('vulnerable-sector-checks', [AdminVulnerableSectorChecksController::class, 'index'])->name('vulnerable-sector-checks.index');
        Route::post('vulnerable-sector-checks/{check}/verification', [AdminVulnerableSectorChecksController::class, 'verify'])->whereNumber('check')->name('vulnerable-sector-checks.verify');
        // The admin application's copy of the document link: the same controller, outside the terms gate (L2-080.3).
        Route::get('vulnerable-sector-checks/{check}/document-link', [DocumentLinksController::class, 'show'])->whereNumber('check')->name('vulnerable-sector-checks.document-link');
        // The application queue, the review screen and each reference's tick (review-artist-application, L2-067.1).
        Route::get('artist-applications', [AdminArtistApplicationsController::class, 'index'])->name('artist-applications.index');
        Route::get('artist-applications/{application}', [AdminArtistApplicationsController::class, 'show'])->whereNumber('application')->name('artist-applications.show');
        Route::put('artist-applications/{application}/references/{reference}/verification', [AdminApplicationReferencesController::class, 'update'])
            ->whereNumber('application')->whereNumber('reference')->name('artist-applications.references.verification');
        Route::post('artist-applications/{application}/approval', [AdminArtistApplicationsController::class, 'approve'])->whereNumber('application')->name('artist-applications.approve');
        Route::post('artist-applications/{application}/rejection', [AdminArtistApplicationsController::class, 'reject'])->whereNumber('application')->name('artist-applications.reject');
        Route::get('artists', [AdminArtistsController::class, 'index'])->name('artists.index');
        Route::get('artists/{artist}', [AdminArtistsController::class, 'show'])->whereNumber('artist')->name('artists.show');
    });
