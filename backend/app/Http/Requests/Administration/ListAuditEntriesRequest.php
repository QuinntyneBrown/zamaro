<?php

namespace App\Http\Requests\Administration;

use App\Enums\AuditOutcome;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Pagination\Cursor;
use Illuminate\Validation\Rule;
use UnexpectedValueException;

/** The audit log's filters and page cursor (administration/record-audit-log). */
class ListAuditEntriesRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The actor's email, any case. */
            'actor' => ['nullable', 'string', 'max:254'],
            /** One action code, such as `auth.sign_in`; a code no entry carries yet matches nothing. */
            'action' => ['nullable', 'string', 'max:64', 'regex:/^[a-z0-9_.]+$/'],
            /** A booking number, or part of an artist's or user's name or a user's email. */
            'target' => ['nullable', 'string', 'max:100'],
            'outcome' => ['nullable', Rule::enum(AuditOutcome::class)],
            /** `YYYY-MM-DD`, Toronto time, inclusive. */
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            /** `meta.nextCursor` from the previous page. */
            'cursor' => ['nullable', 'string', function (string $attribute, string $value, Closure $fail) {
                if (self::decode($value) === null) {
                    $fail('The log has changed. Reload the page.');
                }
            }],
        ];
    }

    /** The position to continue after, or null for the newest entries. */
    public function cursor(): ?Cursor
    {
        $cursor = $this->validated('cursor');

        return $cursor === null ? null : self::decode($cursor);
    }

    /** A cursor over the log's order (newest first), or null when it is anything else. */
    private static function decode(string $value): ?Cursor
    {
        $cursor = Cursor::fromEncoded($value);
        try {
            $cursor?->parameters(['occurred_at', 'id']);
        } catch (UnexpectedValueException) {
            return null;
        }

        return $cursor;
    }
}
