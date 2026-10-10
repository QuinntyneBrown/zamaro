<?php

namespace App\Contracts;

use RuntimeException;

/** The routing vendor failed or timed out; callers fall back to an approximate distance. */
class RoutingUnavailable extends RuntimeException {}
