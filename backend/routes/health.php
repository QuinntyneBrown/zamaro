<?php

use App\Http\Controllers\Health\HealthController;
use Illuminate\Support\Facades\Route;

// Load-balancer probes: outside /api/v1, no session, CSRF or rate limit (L2-090.2).
Route::get('/health/live', [HealthController::class, 'live']);
Route::get('/health/ready', [HealthController::class, 'ready']);
