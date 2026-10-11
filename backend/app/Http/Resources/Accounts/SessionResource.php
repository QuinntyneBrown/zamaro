<?php

namespace App\Http\Resources\Accounts;

use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One signed-in session, for its owner (L2-025.3). Never the session ID itself or the full IP address:
 * `id` is the registry's key, the SHA-256 of the session ID.
 *
 * @property UserSession $resource
 */
class SessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $session = $this->resource;

        return [
            /** Names the session for ending it; not the session ID. */
            'id' => $session->id,
            /** "Chrome on Windows". */
            'deviceLabel' => $session->device_label ?? 'Unknown device',
            /** "Burlington, ON", or null when the network cannot be placed. */
            'approximateCity' => $session->approximate_city,
            /**
             * When the session was last used, to within 5 minutes.
             *
             * @var string
             *
             * @format date-time
             */
            'lastActiveAt' => $session->last_active_at->setTimezone(config('app.timezone'))->toIso8601String(),
            /** The browser asking. */
            'isCurrent' => (bool) $session->is_current,
        ];
    }
}
