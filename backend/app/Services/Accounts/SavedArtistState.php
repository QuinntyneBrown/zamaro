<?php

namespace App\Services\Accounts;

/** Where a saved artist stands after a save or removal, with the booker's count (accounts/save-artist). */
final class SavedArtistState
{
    public function __construct(
        public readonly int $artistId,
        public readonly bool $saved,
        public readonly int $savedCount,
        public readonly bool $firstSave,
    ) {}
}
