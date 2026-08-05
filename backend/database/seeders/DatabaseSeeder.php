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

        $this->seedConfiguredAccount(
            env('DEMO_ACCOUNT_EMAIL'),
            env('DEMO_ACCOUNT_PASSWORD'),
            env('DEMO_ACCOUNT_NAME', 'Demo User'),
            env('DEMO_ACCOUNT_PHONE', '0000000000'),
            env('DEMO_ACCOUNT_ROLE', 'buyer'),
        );

        $this->seedConfiguredAccount(
            env('ADMIN_ACCOUNT_EMAIL'),
            env('ADMIN_ACCOUNT_PASSWORD'),
            env('ADMIN_ACCOUNT_NAME', 'Admin User'),
            env('ADMIN_ACCOUNT_PHONE', '0000000000'),
            'admin',
        );
    }

    private function seedConfiguredAccount(
        ?string $email,
        ?string $password,
        string $name,
        string $phone,
        string $role,
    ): void {
        if (! $email || ! $password) {
            return;
        }

        $role = in_array($role, ['admin', 'buyer'], true) ? $role : 'buyer';

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'phone' => $phone,
                'password' => Hash::make($password),
                'role' => $role,
                'email_verified_at' => now(),
            ],
        );
    }
}
