<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.com')->first();
        $member1 = User::where('email', 'member1@example.com')->first();
        $member2 = User::where('email', 'member2@example.com')->first();

        // Create a test group
        $group = Group::create([
            'name' => 'Development Team',
            'description' => 'Main development team for the project',
            'admin_id' => $admin->id,
        ]);

        // Add members to the group
        $group->users()->attach([$member1->id, $member2->id]);

        // Create a project
        $project = Project::create([
            'name' => 'Web Application',
            'description' => 'Main web application project',
            'group_id' => $group->id,
        ]);

        // Create tasks
        Task::create([
            'title' => 'Setup database schema',
            'description' => 'Create the initial database structure',
            'deadline' => now()->addDays(7),
            'priority' => 'high',
            'status' => 'en_cours',
            'project_id' => $project->id,
            'assigned_to' => $member1->id,
        ]);

        Task::create([
            'title' => 'Design user interface',
            'description' => 'Create mockups and wireframes',
            'deadline' => now()->addDays(10),
            'priority' => 'medium',
            'status' => 'en_attente',
            'project_id' => $project->id,
            'assigned_to' => $member2->id,
        ]);

        Task::create([
            'title' => 'Implement authentication',
            'description' => 'Setup login and registration system',
            'deadline' => now()->addDays(5),
            'priority' => 'high',
            'status' => 'validation',
            'project_id' => $project->id,
            'assigned_to' => $member1->id,
        ]);

        Task::create([
            'title' => 'Write API documentation',
            'description' => 'Document all API endpoints',
            'deadline' => now()->addDays(14),
            'priority' => 'low',
            'status' => 'en_attente',
            'project_id' => $project->id,
            'assigned_to' => $member2->id,
        ]);
    }
}
