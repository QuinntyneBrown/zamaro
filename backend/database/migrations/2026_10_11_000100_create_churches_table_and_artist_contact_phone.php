<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A booker's one church (accounts/manage-church-profile). The address is geocoded and inside the
        // service area before it is stored; the phone is encrypted by the API (L2-079.2).
        Schema::create('churches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booker_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('street_address');
            $table->string('city');
            $table->char('province', 2)->default('ON');
            $table->string('postal_code', 7);
            $table->decimal('latitude', 9, 6);
            $table->decimal('longitude', 9, 6);
            $table->text('phone');
            $table->string('denomination')->nullable();
            $table->unsignedInteger('typical_attendance')->nullable();
            $table->timestampsTz();
        });

        // An artist's private contact phone (L2-025.4), encrypted by the API; never public.
        Schema::table('artists', function (Blueprint $table) {
            $table->text('contact_phone')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('artists', function (Blueprint $table) {
            $table->dropColumn('contact_phone');
        });
        Schema::dropIfExists('churches');
    }
};
