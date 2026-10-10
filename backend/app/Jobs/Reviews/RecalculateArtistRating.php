<?php

namespace App\Jobs\Reviews;

use App\Models\ArtistRating;
use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Rewrites an artist's rating summary from their visible reviews (L2-060): the mean of the stars
 * rounded to one decimal (4.86 → 4.9), and the number of distinct churches that left one. Unique
 * per artist while queued, so a burst of review events runs once; on the high queue, so a hidden
 * review leaves the rating within 60 seconds.
 */
class RecalculateArtistRating implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly int $artistId)
    {
        $this->onQueue('high');
    }

    public function uniqueId(): string
    {
        return (string) $this->artistId;
    }

    public function handle(): void
    {
        // Until churches have their own records (M2), a church is the booking's name and city.
        $summary = Review::visible()
            ->join('bookings', 'bookings.id', '=', 'reviews.booking_id')
            ->where('reviews.artist_id', $this->artistId)
            ->selectRaw('avg(reviews.stars) as mean, count(distinct (bookings.church_name, bookings.church_city)) as churches')
            ->toBase()
            ->first();
        $churches = (int) $summary->churches;

        ArtistRating::updateOrCreate(['artist_id' => $this->artistId], [
            'rating' => $churches === 0 ? null : round((float) $summary->mean, 1),
            'review_count' => $churches,
            'recalculated_at' => now(),
        ]);
    }
}
