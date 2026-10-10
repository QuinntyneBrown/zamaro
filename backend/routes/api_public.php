<?php

use App\Http\Controllers\Api\V1\Discovery\PlaceController;
use App\Http\Controllers\Api\V1\Discovery\SearchController;
use App\Http\Controllers\Api\V1\UserExperience\TranslationCatalogueController;
use Illuminate\Support\Facades\Route;

// /api/v1 routes that are intentionally anonymous. Everything else belongs in api.php.

Route::get('i18n/{locale}', [TranslationCatalogueController::class, 'show'])->name('i18n.show');
Route::get('search', SearchController::class)->middleware('throttle:search')->name('search');
Route::get('places', PlaceController::class)->name('places');
