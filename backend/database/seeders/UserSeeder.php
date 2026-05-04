<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'member1@example.com'],
            [
                'name' => 'Member One',
                'password' => Hash::make('password123'),
                'role' => 'member',
            ]
        );

        User::updateOrCreate(
            ['email' => 'member2@example.com'],
            [
                'name' => 'Member Two',
                'password' => Hash::make('password123'),
                'role' => 'member',
            ]
        );
    }
}
