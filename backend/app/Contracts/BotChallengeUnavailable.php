<?php

namespace App\Contracts;

use RuntimeException;

/** The bot challenge provider did not answer; the form is refused, as if the check failed (M2 D3). */
class BotChallengeUnavailable extends RuntimeException {}
