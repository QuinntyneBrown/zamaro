<?php

namespace App\Models;

use App\Enums\UploadPurpose;
use App\Enums\UploadStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One uploaded file on its way through quarantine (security/scan-and-serve-uploads). */
class Upload extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'purpose' => UploadPurpose::class,
            'status' => UploadStatus::class,
            'scanned_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
