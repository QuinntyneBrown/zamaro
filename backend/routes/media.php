<?php

use App\Http\Controllers\Media\PrivateDocumentController;
use Illuminate\Support\Facades\Route;

// The media host (L2-076.3, M3 D10): private documents behind 5-minute signed links, outside /api/v1
// and without a session. The same path on the API host does not exist.
Route::domain(config('zamaro.media_host'))->middleware('signed')->group(function () {
    Route::get('documents/{key}', [PrivateDocumentController::class, 'show'])->where('key', '[0-9a-f]{32}')->name('documents.show');
});
