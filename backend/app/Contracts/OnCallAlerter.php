<?php

namespace App\Contracts;

/**
 * Raises an alert to the on-call person directly, for failures that metrics alone would miss, such as
 * a job that exhausted its retries (L2-092.1, L2-093.3). The vendor is chosen in M10; until then
 * FakeOnCallAlerter is bound (ADR-0002).
 */
interface OnCallAlerter
{
    public function raise(Alert $alert): void;
}
