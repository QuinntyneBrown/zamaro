<?php

namespace App\Services\Operations\Readiness;

interface HealthCheck
{
    public function name(): string;

    /**
     * Throws when the dependency does not answer.
     */
    public function check(): void;
}
