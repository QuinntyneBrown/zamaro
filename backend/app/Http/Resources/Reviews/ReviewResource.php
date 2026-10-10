<?php

namespace App\Http\Resources\Reviews;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One public review: the stars, the church's words and who said them. Only the reviewer's name,
 * church, city and month leave the server; never the booker's account, email, booking number or
 * event date (L2-083.2).
 *
 * @property Review $resource
 */
class ReviewResource extends JsonResource
{
    private const TIMEZONE = 'America/Toronto';

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $review = $this->resource;
        $reply = $review->reply;

        return [
            'id' => $review->id,
            /** Whole stars, 1–5. */
            'stars' => $review->stars,
            /** Plain text as the church wrote it; paragraphs are separated by a blank line. */
            'text' => $review->text,
            'attribution' => [
                /** "Rev. Janet Clarke". */
                'reviewerName' => $review->booker->name,
                /** The church as it was named on the booking: "St. Brendan’s Anglican". */
                'churchName' => $review->booking->church_name,
                'city' => $review->booking->church_city,
                /** When the review was written, as `YYYY-MM`: shown as "September 2026". */
                'month' => $review->created_at->setTimezone(self::TIMEZONE)->format('Y-m'),
            ],
            /** The artist's reply, shown beneath as "Reply from {artistName} · {month}", or null. */
            'reply' => $reply === null ? null : [
                'text' => $reply->text,
                'artistName' => $reply->artist->display_name,
                /** `YYYY-MM`. */
                'month' => $reply->created_at->setTimezone(self::TIMEZONE)->format('Y-m'),
            ],
        ];
    }
}
