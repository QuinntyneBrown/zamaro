<?php

namespace App\Actions\Reviews;

use App\Actions\ArtistProfiles\ArtistMoved;
use App\Actions\ArtistProfiles\ArtistNotFound;
use App\Actions\ArtistProfiles\ResolveArtistSlug;
use App\Models\Artist;
use App\Models\Review;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Pagination\Cursor;

/**
 * A visible artist's visible reviews, newest first, a page at a time (L2-018, L2-095.1): the
 * profile carries the first 4 and "Show all" fetches 10 more each time. Hidden reviews are never
 * read (L2-062). Each review brings its church snapshot, its reviewer and the artist's reply.
 */
class ListArtistReviews
{
    public const ON_PROFILE = 4;

    public const PER_PAGE = 10;

    public function __construct(private readonly ResolveArtistSlug $slugs) {}

    /**
     * @throws ArtistMoved when the slug is the artist's retired one
     * @throws ArtistNotFound when no visible artist has the slug
     */
    public function handle(string $slug, ?Cursor $cursor): CursorPaginator
    {
        return $this->page($this->slugs->handle($slug), self::PER_PAGE, $cursor);
    }

    public function page(Artist $artist, int $perPage, ?Cursor $cursor = null): CursorPaginator
    {
        return Review::visible()
            ->where('artist_id', $artist->id)
            ->with(['booker:id,name', 'booking:id,church_name,church_city', 'reply.artist:id,display_name'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($perPage, cursor: $cursor);
    }

    /** How many visible reviews the artist has, for "Show all 38 reviews". */
    public function total(Artist $artist): int
    {
        return Review::visible()->where('artist_id', $artist->id)->count();
    }
}
