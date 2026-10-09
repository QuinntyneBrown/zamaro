<?php

namespace App\Http\Controllers\Health;

use App\Http\Controllers\Controller;
use App\Services\Operations\Readiness\ReadinessChecker;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function live(): JsonResponse
    {
        return response()->json(['status' => 'live']);
    }

    public function ready(ReadinessChecker $checker): JsonResponse
    {
        $report = $checker->run();

        return $report->ready()
            ? response()->json(['status' => 'ready'])
            : response()->json(['status' => 'not ready', 'failed' => $report->failed()], 503);
    }
}
