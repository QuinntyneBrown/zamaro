<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The closed set of roles (App\Enums\Role); a person can hold more than one.
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 20)->unique();
        });

        Schema::create('role_user', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained();
            $table->primary(['user_id', 'role_id']);
        });

        DB::table('roles')->insert([['name' => 'booker'], ['name' => 'artist'], ['name' => 'admin']]);
    }

    public function down(): void
    {
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('roles');
    }
};
