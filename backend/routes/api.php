<?php

use App\Http\Controllers\Api\V1\Accounts\AccountEmailController;
use App\Http\Controllers\Api\V1\Accounts\AccountPasswordController;
use App\Http\Controllers\Api\V1\Accounts\AccountProfileController;
use App\Http\Controllers\Api\V1\Accounts\AccountSessionController;
use App\Http\Controllers\Api\V1\Accounts\ArtistContactController;
use App\Http\Controllers\Api\V1\Accounts\ChurchController;
use App\Http\Controllers\Api\V1\Accounts\MeController;
use App\Http\Controllers\Api\V1\Accounts\SessionController;
use App\Http\Controllers\Api\V1\Accounts\TwoFactorController;
use App\Http\Middleware\SetCachePolicy;
use App\Http\Middleware\TrackSessionActivity;
use Illuminate\Support\Facades\Route;

// /api/v1 routes that require a signed-in user. Anonymous routes belong in api_public.php.
// Everything here may hold personal data, so nothing here is cached (L2-089.3).

Route::middleware(['auth:sanctum', SetCachePolicy::class, TrackSessionActivity::class])->group(function () {
    Route::get('me', [MeController::class, 'show'])->name('me.show');
    Route::delete('session', [SessionController::class, 'destroy'])->name('session.destroy');

    // Account settings (accounts/manage-account-settings, accounts/manage-church-profile).
    Route::put('account/profile', [AccountProfileController::class, 'update'])->name('account.profile.update');
    Route::put('account/email', [AccountEmailController::class, 'update'])->name('account.email.update');
    Route::put('account/password', [AccountPasswordController::class, 'update'])->name('account.password.update');
    Route::post('account/two-factor', [TwoFactorController::class, 'begin'])->name('account.two-factor.begin');
    Route::get('account/two-factor/qr', [TwoFactorController::class, 'qr'])->name('account.two-factor.qr');
    Route::post('account/two-factor/confirm', [TwoFactorController::class, 'confirm'])->name('account.two-factor.confirm');
    Route::get('account/sessions', [AccountSessionController::class, 'index'])->name('account.sessions.index');
    Route::delete('account/sessions/{session}', [AccountSessionController::class, 'destroy'])->name('account.sessions.destroy');
    Route::middleware('role:booker')->group(function () {
        Route::get('account/church', [ChurchController::class, 'show'])->name('account.church.show');
        Route::put('account/church', [ChurchController::class, 'update'])->name('account.church.update');
    });
    Route::middleware('role:artist')->group(function () {
        Route::get('account/contact-phone', [ArtistContactController::class, 'show'])->name('account.contact-phone.show');
        Route::put('account/contact-phone', [ArtistContactController::class, 'update'])->name('account.contact-phone.update');
    });
});
