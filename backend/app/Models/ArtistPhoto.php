<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ArtistPhoto extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['position' => 'integer', 'renditions' => 'array', 'width' => 'integer', 'height' => 'integer'];
    }

    /**
     * The renditions in one format, narrowest first.
     *
     * @return list<array{width: int, format: string, key: string}>
     */
    public function renditionsIn(string $format): array
    {
        $renditions = array_values(array_filter($this->renditions, fn (array $rendition) => $rendition['format'] === $format));
        usort($renditions, fn (array $a, array $b) => $a['width'] <=> $b['width']);

        return $renditions;
    }
}
