<?php

namespace App\Models;

use App\Casts\EncryptedField;
use App\Enums\Role as RoleName;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mfa_enabled' => 'boolean',
            // The TOTP key, encrypted with the field key (ADR-0020).
            'two_factor_secret' => EncryptedField::class,
            'two_factor_confirmed_at' => 'immutable_datetime',
            'first_saved_at' => 'immutable_datetime',
        ];
    }

    /** A booker's one church (accounts/manage-church-profile). @return HasOne<Church, $this> */
    public function church(): HasOne
    {
        return $this->hasOne(Church::class, 'booker_id');
    }

    /** @return BelongsToMany<Role, $this> */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    /** @return list<RoleName> */
    public function roleNames(): array
    {
        return $this->roles->pluck('name')->sortBy(fn (RoleName $role) => $role->value)->values()->all();
    }

    /** @param  list<RoleName>  $roles */
    public function grantRoles(array $roles): void
    {
        $ids = Role::whereIn('name', array_map(fn (RoleName $role) => $role->value, $roles))->pluck('id');
        $this->roles()->syncWithoutDetaching($ids);
    }

    /** The first letters of a person's first and last names: Naomi Fraser → "NF" (avatar CRD). */
    public function initials(): string
    {
        $words = preg_split('/\s+/', trim($this->name), -1, PREG_SPLIT_NO_EMPTY) ?: [''];
        $first = Str::substr($words[0], 0, 1);
        $last = count($words) > 1 ? Str::substr($words[count($words) - 1], 0, 1) : '';

        return Str::upper($first.$last);
    }
}
