<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('seller_phone', 40)->nullable()->after('location');
            $table->string('seller_telegram', 80)->nullable()->after('seller_phone');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['seller_phone', 'seller_telegram']);
        });
    }
};
