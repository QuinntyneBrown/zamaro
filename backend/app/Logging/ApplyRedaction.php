<?php

namespace App\Logging;

use Illuminate\Log\Logger;

/**
 * The `tap` on every channel in config/logging.php. Pushed last, so it runs before the channel's own
 * processors and no placeholder copies a secret into the message first.
 */
class ApplyRedaction
{
    public function __invoke(Logger $logger): void
    {
        $logger->getLogger()->pushProcessor(new RedactSensitiveData);
    }
}
