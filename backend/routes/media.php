<?php

use App\Http\Controllers\Media\MediaController;
use Illuminate\Support\Facades\Route;

// The media disk, outside /api/v1, in place of the CDN until object storage arrives (M4).
Route::get('/media/{path}', [MediaController::class, 'show'])->where('path', '.*')->name('media.show');
