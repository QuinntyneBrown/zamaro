<?php

namespace Tests\Feature\Operations;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

/**
 * L2-090.2: liveness and readiness probes.
 */
class HealthChecksTest extends TestCase
{
    public function test_live_returns_200_while_the_process_runs(): void
    {
        $this->get('/health/live')->assertOk();
    }

    public function test_ready_returns_200_when_every_dependency_answers(): void
    {
        $this->get('/health/ready')
            ->assertOk()
            ->assertExactJson(['status' => 'ready']);
    }

    public function test_ready_returns_503_naming_the_cache_when_it_is_unreachable(): void
    {
        $this->makeRedisConnectionUnreachable('cache');

        $this->get('/health/ready')
            ->assertStatus(503)
            ->assertExactJson(['status' => 'not ready', 'failed' => ['cache']]);
    }

    public function test_ready_returns_503_naming_the_queue_when_it_is_unreachable(): void
    {
        $this->makeRedisConnectionUnreachable('default');

        $this->get('/health/ready')
            ->assertStatus(503)
            ->assertExactJson(['status' => 'not ready', 'failed' => ['queue']]);
    }

    public function test_ready_returns_503_naming_the_database_when_it_is_unreachable(): void
    {
        config(['database.connections.pgsql.host' => '127.0.0.1', 'database.connections.pgsql.port' => 1]);
        DB::purge('pgsql');

        $this->get('/health/ready')
            ->assertStatus(503)
            ->assertExactJson(['status' => 'not ready', 'failed' => ['database']]);
    }

    private function makeRedisConnectionUnreachable(string $connection): void
    {
        config(["database.redis.{$connection}.host" => '127.0.0.1', "database.redis.{$connection}.port" => 1]);
        Redis::purge($connection);
    }
}
