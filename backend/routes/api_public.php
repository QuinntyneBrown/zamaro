<?php

use App\Http\Controllers\Api\V1\Accounts\AccountEmailController;
use App\Http\Controllers\Api\V1\Accounts\EmailVerificationController;
use App\Http\Controllers\Api\V1\Accounts\PasswordResetController;
use App\Http\Controllers\Api\V1\Accounts\RegistrationController;
use App\Http\Controllers\Api\V1\Accounts\SessionController;
use App\Http\Controllers\Api\V1\ArtistOnboarding\ApplicationVideoUploadsController;
use App\Http\Controllers\Api\V1\ArtistOnboarding\ArtistApplicationsController;
use App\Http\Controllers\Api\V1\ArtistProfiles\ArtistAvailabilityController;
use App\Http\Controllers\Api\V1\ArtistProfiles\ArtistProfileController;
use App\Http\Controllers\Api\V1\ArtistProfiles\SitemapController;
use App\Http\Controllers\Api\V1\Discovery\PlaceController;
use App\Http\Controllers\Api\V1\Discovery\SearchAlternativesController;
use App\Http\Controllers\Api\V1\Discovery\SearchController;
use App\Http\Controllers\Api\V1\Operations\FeatureFlagsController;
use App\Http\Controllers\Api\V1\Privacy\LegalDocumentController;
use App\Http\Controllers\Api\V1\Reviews\ArtistReviewsController;
use App\Http\Controllers\Api\V1\UserExperience\TranslationCatalogueController;
use App\Http\Middleware\SetCachePolicy;
use Illuminate\Support\Facades\Route;

// /api/v1 routes that are intentionally anonymous. Everything else belongs in api.php.

Route::get('i18n/{locale}', [TranslationCatalogueController::class, 'show'])->name('i18n.show');
Route::get('features', FeatureFlagsController::class)->name('features');
Route::get('search', SearchController::class)->middleware('throttle:search')->name('search');
Route::get('search/alternatives', SearchAlternativesController::class)->middleware('throttle:search')->name('search.alternatives');
Route::get('places', PlaceController::class)->name('places');
// Public profile responses revalidate with an ETag of their body; 304 when unchanged (L2-089.1).
Route::get('artists/{slug}', [ArtistProfileController::class, 'show'])->middleware('cache.headers:etag')->name('artists.show');
Route::get('artists/{slug}/reviews', ArtistReviewsController::class)->name('artists.reviews');
Route::get('artists/{slug}/availability', [ArtistAvailabilityController::class, 'check'])->middleware('cache.headers:etag')->name('artists.availability');
Route::get('artists/{slug}/tour-dates', [ArtistAvailabilityController::class, 'tourDates'])->middleware('cache.headers:etag')->name('artists.tour-dates');
Route::get('sitemap', SitemapController::class)->name('sitemap');
// Signing in answers with the account, so it is never cached (L2-089.3).
Route::post('session', [SessionController::class, 'store'])->middleware(SetCachePolicy::class)->name('session.store');
// Registering answers the same for every valid submission; the bot check runs before validation (L2-077.4).
Route::post('register', RegistrationController::class)->middleware(['throttle:register', 'bot-challenge:register', SetCachePolicy::class])->name('register');
// An emailed link: anyone holding it may use it, once (L2-022.3). The answer names the person.
Route::post('email/verify', [EmailVerificationController::class, 'verify'])->middleware(SetCachePolicy::class)->name('email.verify');
// A signed-in booker, an expired link's owner or a guest who just signed up; 3 in 15 minutes (M2 D6).
Route::post('email/verification-notification', [EmailVerificationController::class, 'resend'])->middleware(['throttle:resend-verification', SetCachePolicy::class])->name('email.resend');
// Forgotten passwords: the same answer for any address, behind the bot check (L2-023.3, L2-077.4).
Route::post('password/forgot', [PasswordResetController::class, 'forgot'])->middleware(['throttle:forgot-password', 'bot-challenge:forgot-password', SetCachePolicy::class])->name('password.forgot');
Route::post('password/reset/check', [PasswordResetController::class, 'check'])->middleware(['throttle:password-reset', SetCachePolicy::class])->name('password.check');
Route::post('password/reset', [PasswordResetController::class, 'reset'])->middleware(['throttle:password-reset', SetCachePolicy::class])->name('password.reset');
// The code step of signing in; the lockout and a 30-a-minute limit stop guessing (L2-072.4).
Route::post('session/two-factor', [SessionController::class, 'twoFactor'])->middleware(['throttle:password-reset', SetCachePolicy::class])->name('session.two-factor');
// An email change link: anyone holding it may open it, so it signs no one in (L2-025.1).
Route::post('account/email/confirm', [AccountEmailController::class, 'confirm'])->middleware(['throttle:password-reset', SetCachePolicy::class])->name('account.email.confirm');
Route::get('legal-documents/current', [LegalDocumentController::class, 'current'])->name('legal-documents.current');

// An applicant's video upload, before any account exists (apply-as-artist, ADR-0026): chunks of up
// to 8 MB; the token is the only key to the upload.
Route::prefix('artist-applications/videos')->name('artist-applications.videos.')->middleware(SetCachePolicy::class)->group(function () {
    Route::post('/', [ApplicationVideoUploadsController::class, 'store'])->name('store');
    Route::patch('{token}', [ApplicationVideoUploadsController::class, 'append'])->where('token', '[0-9a-f]+')->middleware('uploads:8192')->name('append');
    Route::get('{token}', [ApplicationVideoUploadsController::class, 'show'])->where('token', '[0-9a-f]+')->name('show');
});
// Applying as an artist (apply-as-artist, L2-047): the bot check runs before validation (L2-077.4).
Route::post('artist-applications', [ArtistApplicationsController::class, 'store'])->middleware(['throttle:register', 'bot-challenge:artist-application', SetCachePolicy::class])->name('artist-applications.store');
