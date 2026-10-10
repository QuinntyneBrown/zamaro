<?php

use App\Http\Controllers\Api\V1\Accounts\MeController;
use App\Http\Middleware\SetCachePolicy;
use Illuminate\Support\Facades\Route;

// /api/v1 routes that require a signed-in user. Anonymous routes belong in api_public.php.
// Everything here may hold personal data, so nothing here is cached (L2-089.3).

Route::middleware(['auth:sanctum', SetCachePolicy::class])->group(function () {
    Route::get('me', [MeController::class, 'show'])->name('me.show');
});
