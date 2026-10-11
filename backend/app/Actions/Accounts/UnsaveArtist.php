<?php

namespace App\Actions\Accounts;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Removes a saved artist (L2-026); removing one that was not saved changes nothing. */
class UnsaveArtist
{
    /** @return int the booker's new count */
    public function handle(User $booker, int $artistId): int
    {
        DB::table('saved_artists')->where('user_id', $booker->id)->where('artist_id', $artistId)->delete();

        return DB::table('saved_artists')->where('user_id', $booker->id)->count();
    }
}
