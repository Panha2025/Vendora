<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $demoEmail = env('DEMO_ACCOUNT_EMAIL');
        $demoPassword = env('DEMO_ACCOUNT_PASSWORD');

        if (! $demoEmail || ! $demoPassword) {
            return;
        }

        User::updateOrCreate(
            ['email' => $demoEmail],
            [
                'name' => env('DEMO_ACCOUNT_NAME', 'Demo User'),
                'phone' => env('DEMO_ACCOUNT_PHONE', '0000000000'),
                'password' => Hash::make($demoPassword),
                'role' => 'buyer',
                'email_verified_at' => now(),
            ],
        );
    }
}
