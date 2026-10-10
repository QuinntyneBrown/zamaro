<?php

namespace App\Http\Requests\Reviews;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Pagination\Cursor;
use UnexpectedValueException;

class ListArtistReviewsRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** `reviews.nextCursor` from the profile, or `meta.nextCursor` from the previous page. */
            'cursor' => ['nullable', 'string', function (string $attribute, string $value, Closure $fail) {
                if (self::decode($value) === null) {
                    $fail('These reviews have changed. Reload the page.');
                }
            }],
        ];
    }

    /** The position to continue after, or null for the newest reviews. */
    public function cursor(): ?Cursor
    {
        $cursor = $this->validated('cursor');

        return $cursor === null ? null : self::decode($cursor);
    }

    /** A cursor over the reviews' order (newest first), or null when it is anything else. */
    private static function decode(string $value): ?Cursor
    {
        $cursor = Cursor::fromEncoded($value);
        try {
            $cursor?->parameters(['created_at', 'id']);
        } catch (UnexpectedValueException) {
            return null;
        }

        return $cursor;
    }
}
