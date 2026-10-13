<?php

namespace App\Contracts;

use App\Enums\ScanVerdict;

/** The scanner's answer: the verdict and, for malware, the signature it matched. */
final readonly class ScanResult
{
    public function __construct(public ScanVerdict $verdict, public ?string $signature = null) {}

    public static function clean(): self
    {
        return new self(ScanVerdict::Clean);
    }

    public static function infected(string $signature): self
    {
        return new self(ScanVerdict::Infected, $signature);
    }

    public static function error(): self
    {
        return new self(ScanVerdict::Error);
    }
}
