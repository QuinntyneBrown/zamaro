<?php

namespace App\Services\Operations\Readiness;

final class ReadinessReport
{
    /**
     * @param  list<CheckResult>  $results
     */
    public function __construct(public readonly array $results) {}

    public function ready(): bool
    {
        return $this->failed() === [];
    }

    /**
     * @return list<string>
     */
    public function failed(): array
    {
        return array_values(array_map(
            fn (CheckResult $result) => $result->name,
            array_filter($this->results, fn (CheckResult $result) => ! $result->ok),
        ));
    }
}
