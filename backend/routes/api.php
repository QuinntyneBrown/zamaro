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
use App\Http\Controllers\Api\V1\Privacy\ConsentController;
use App\Http\Middleware\EnsureCurrentTermsAccepted;
use App\Http\Middleware\SetCachePolicy;
use App\Http\Middleware\TrackSessionActivity;
use Illuminate\Support\Facades\Route;

// /api/v1 routes that require a signed-in user. Anonymous routes belong in api_public.php.
// Everything here may hold personal data, so nothing here is cached (L2-089.3).

// Until the current terms are accepted, only /me, sign-out and the acceptance answer (L2-080.3).
Route::middleware(['auth:sanctum', SetCachePolicy::class, TrackSessionActivity::class, EnsureCurrentTermsAccepted::class])->group(function () {
    Route::get('me', [MeController::class, 'show'])->name('me.show');
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
    Route::middleware('role:booker')->group(function () {
        Route::get('account/church', [ChurchController::class, 'show'])->name('account.church.show');
        Route::put('account/church', [ChurchController::class, 'update'])->name('account.church.update');
    });
    Route::middleware('role:booker')->group(function () {
        Route::get('saved-artists/ids', [SavedArtistController::class, 'ids'])->name('saved-artists.ids');
        Route::put('saved-artists/{artist}', [SavedArtistController::class, 'update'])->whereNumber('artist')->name('saved-artists.update');
        Route::delete('saved-artists/{artist}', [SavedArtistController::class, 'destroy'])->whereNumber('artist')->name('saved-artists.destroy');
    });
    Route::middleware('role:artist')->group(function () {
        Route::get('account/contact-phone', [ArtistContactController::class, 'show'])->name('account.contact-phone.show');
        Route::put('account/contact-phone', [ArtistContactController::class, 'update'])->name('account.contact-phone.update');
    });
});
