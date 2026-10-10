<?php

namespace App\Services\Discovery;

use App\Enums\Style;
use Illuminate\Database\Eloquent\Builder;

/** The style chips (any selected style matches) and the Under $800 chip, which applies on top (L2-008). */
final class LineupFilter
{
    public const UNDER_PRICE_CENTS = 80000;

    /**
     * @param  list<Style>  $styles
     */
    public function __construct(
        public readonly array $styles = [],
        public readonly bool $under800 = false,
    ) {}

    public function applyTo(Builder $artists): void
    {
        if ($this->styles !== []) {
            $artists->whereExists(fn ($query) => $query->from('artist_styles')
                ->whereColumn('artist_styles.artist_id', 'artists.id')
                ->whereIn('artist_styles.style', array_map(fn (Style $style) => $style->value, $this->styles)));
        }
        if ($this->under800) {
            $artists->where('from_price_cents', '<', self::UNDER_PRICE_CENTS);
        }
    }
}
