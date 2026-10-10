<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The columns search and tour dates read. Booker, church and payment columns are added by the
     * booking milestones (expand-contract).
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('artist_id')->constrained();
            $table->string('status');
            $table->date('event_date');
            $table->string('kind');
            $table->string('church_name');
            $table->string('church_city');
            $table->timestamps();

            $table->index(['artist_id', 'event_date']);
        });

        // L2-032: an artist has at most one Confirmed booking per date.
        DB::statement("CREATE UNIQUE INDEX bookings_one_confirmed_per_date ON bookings (artist_id, event_date) WHERE status = 'confirmed'");
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
