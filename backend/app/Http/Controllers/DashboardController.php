<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        if ($user->role === 'admin') {
            return $this->adminDashboard($user);
        } else {
            return $this->memberDashboard($user);
        }
    }

    private function adminDashboard($user)
    {
        $adminGroupIds = $user->administeredGroups()->pluck('id');

        $totalMembers = User::where('role', 'member')
            ->whereHas('groups', function ($q) use ($adminGroupIds) {
                $q->whereIn('groups.id', $adminGroupIds);
            })
            ->count();

        $stats = [
            'total_groups' => $user->administeredGroups()->count(),
            'total_members' => $totalMembers,
            'total_projects' => Project::whereHas('group', function ($query) use ($user) {
                $query->where('admin_id', $user->id);
            })->count(),
            'total_tasks' => Task::whereHas('project.group', function ($query) use ($user) {
                $query->where('admin_id', $user->id);
            })->count(),
            'tasks_by_status' => Task::whereHas('project.group', function ($query) use ($user) {
                $query->where('admin_id', $user->id);
            })->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'tasks_by_priority' => Task::whereHas('project.group', function ($query) use ($user) {
                $query->where('admin_id', $user->id);
            })->selectRaw('priority, COUNT(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority')
                ->toArray(),
            'recent_groups' => $user->administeredGroups()
                ->with('users')
                ->latest()
                ->take(5)
                ->get(),
            'recent_projects' => Project::whereHas('group', function ($query) use ($user) {
                $query->where('admin_id', $user->id);
            })->with('group')
                ->latest()
                ->take(5)
                ->get(),
            'tasks_awaiting_validation' => Task::whereHas('project.group', function ($query) use ($user) {
                $query->where('admin_id', $user->id);
            })->where('status', 'validation')
                ->with('assignedUser', 'project')
                ->latest()
                ->get(),
        ];

        return response()->json($stats);
    }

    private function memberDashboard($user)
    {
        $stats = [
            'total_groups' => $user->groups()->count(),
            'total_tasks' => $user->assignedTasks()->count(),
            'tasks_by_status' => $user->assignedTasks()
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'tasks_by_priority' => $user->assignedTasks()
                ->selectRaw('priority, COUNT(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority')
                ->toArray(),
            'my_tasks' => $user->assignedTasks()
                ->with('project.group', 'project.group.admin')
                ->latest()
                ->get(),
            'upcoming_deadlines' => $user->assignedTasks()
                ->whereNotNull('deadline')
                ->where('deadline', '>=', now())
                ->where('status', '!=', 'terminee')
                ->with('project.group')
                ->orderBy('deadline')
                ->take(5)
                ->get(),
            'overdue_tasks' => $user->assignedTasks()
                ->whereNotNull('deadline')
                ->where('deadline', '<', now())
                ->where('status', '!=', 'terminee')
                ->with('project.group')
                ->get(),
        ];

        return response()->json($stats);
    }
}
