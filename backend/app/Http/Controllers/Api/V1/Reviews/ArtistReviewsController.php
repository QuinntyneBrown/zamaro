<?php

namespace App\Http\Controllers\Api\V1\Reviews;

use App\Actions\Reviews\ListArtistReviews;
use App\Http\Controllers\Controller;
use App\Http\Requests\Reviews\ListArtistReviewsRequest;
use App\Http\Resources\Reviews\ReviewResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ArtistReviewsController extends Controller
{
    /**
     * An artist's visible reviews, newest first, 10 at a time. The profile already carries the
     * first 4 and the cursor to continue from.
     *
     * @throws NotFoundHttpException when no visible artist has the address
     */
    public function __invoke(ListArtistReviewsRequest $request, ListArtistReviews $reviews, string $slug): AnonymousResourceCollection
    {
        $page = $reviews->handle($slug, $request->cursor());

        return ReviewResource::collection($page->items())->additional([
            'meta' => [
                'perPage' => ListArtistReviews::PER_PAGE,
                /** Pass as `cursor` for the next page; null on the last page. */
                'nextCursor' => $page->nextCursor()?->encode(),
            ],
        ]);
    }
}
