<?php

namespace App\Services\Operations\Readiness;

use Illuminate\Support\Facades\Redis;

/**
 * PINGs the Redis connection behind the cache or the queue.
 */
class RedisCheck implements HealthCheck
{
    public function __construct(
        private readonly string $name,
        private readonly string $connectionConfigKey,
    ) {}

    public static function cache(): self
    {
        return new self('cache', 'cache.stores.redis.connection');
    }

    public static function queue(): self
    {
        return new self('queue', 'queue.connections.redis.connection');
    }

    public function name(): string
    {
        return $this->name;
    }

    public function check(): void
    {
        Redis::connection(config($this->connectionConfigKey, 'default'))->ping();
    }
}
