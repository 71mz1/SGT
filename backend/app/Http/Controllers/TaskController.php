<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        if ($user->role === 'admin') {
            $tasks = Task::with('project.group', 'assignedUser')->get();
        } else {
            // Members can only see their assigned tasks
            // Ensure both are integers for proper comparison
            $userId = (int) $user->id;
            $tasks = Task::where('assigned_to', $userId)
                ->with('project.group', 'assignedUser')
                ->get();
        }
        
        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'priority' => 'in:low,medium,high',
            'project_id' => 'required|exists:projects,id',
            'assigned_to' => 'required|exists:users,id',
        ]);

        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project = Project::findOrFail($request->project_id);
        
        // Check if user is admin of the project's group
        if ($project->group->admin_id !== $user->id) {
            return response()->json(['message' => 'You are not the admin of this project group'], 403);
        }

        // Check if assigned user is a member of the project's group
        $assignedUser = User::findOrFail($request->assigned_to);
        if (!$assignedUser->groups()->where('groups.id', $project->group_id)->exists()) {
            return response()->json(['message' => 'Assigned user is not a member of this project group'], 422);
        }

        $task = Task::create([
            'title' => $request->title,
            'description' => $request->description,
            'deadline' => $request->deadline,
            'priority' => $request->priority ?? 'medium',
            'status' => 'en_attente',
            'project_id' => (int) $request->project_id,
            'assigned_to' => (int) $request->assigned_to,
        ]);

        return response()->json($task->load('project.group', 'assignedUser'), 201);
    }

    public function show(Task $task)
    {
        $user = Auth::user();
        
        // Check if user is admin or the assigned user
        if ($user->role !== 'admin' && $task->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($task->load('project.group', 'assignedUser'));
    }

    public function update(Request $request, Task $task)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'priority' => 'in:low,medium,high',
            'assigned_to' => 'exists:users,id',
        ]);

        $user = Auth::user();

        // Admin can update any task in their group
        if ($user->role === 'admin') {
            // Check if user is admin of the task's project group
            if ($task->project->group->admin_id !== $user->id) {
                return response()->json(['message' => 'You are not the admin of this project group'], 403);
            }

            // If changing assigned user, check if new user is a member of the project's group
            if ($request->has('assigned_to')) {
                $assignedUser = User::findOrFail($request->assigned_to);
                if (!$assignedUser->groups()->where('groups.id', $task->project->group_id)->exists()) {
                    return response()->json(['message' => 'Assigned user is not a member of this project group'], 422);
                }
            }

            $task->update($request->all());
            return response()->json($task->load('project.group', 'assignedUser'));
        }

        // Members can only update their own assigned tasks
        if ($user->role === 'member') {
            if ($task->assigned_to !== $user->id) {
                return response()->json(['message' => 'Unauthorized - You can only update tasks assigned to you'], 403);
            }

            // Members cannot change the assigned_to field
            $updateData = $request->only(['title', 'description', 'deadline', 'priority']);
            $task->update($updateData);

            return response()->json($task->load('project.group', 'assignedUser'));
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    public function destroy(Task $task)
    {
        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if user is admin of the task's project group
        if ($task->project->group->admin_id !== $user->id) {
            return response()->json(['message' => 'You are not the admin of this project group'], 403);
        }

        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }

    public function updateStatus(Request $request, Task $task)
    {
        $request->validate([
            'status' => 'required|in:en_attente,en_cours,validation,terminee'
        ]);

        $user = Auth::user();
        
        // Check if user is admin or the assigned user
        if ($user->role !== 'admin' && $task->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Members cannot change status of completed tasks
        if ($user->role === 'member' && $task->status === 'terminee') {
            return response()->json(['message' => 'Cannot change status of completed tasks'], 403);
        }

        // Members can only set status to: en_attente, en_cours, validation (not terminee)
        if ($user->role === 'member' && $request->status === 'terminee') {
            return response()->json(['message' => 'Members cannot mark tasks as completed'], 403);
        }

        $task->update(['status' => $request->status]);

        return response()->json($task->load('project.group', 'assignedUser'));
    }

    public function validateTask(Task $task)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if task belongs to a project in a group administered by the current admin
        if ($task->project->group->admin_id !== $user->id) {
            return response()->json(['message' => 'You are not the admin of this task\'s group'], 403);
        }

        if ($task->status !== 'validation') {
            return response()->json(['message' => 'Task must be in validation status'], 422);
        }

        $task->update(['status' => 'terminee']);

        return response()->json($task->load('project.group', 'assignedUser'));
    }

    public function returnTask(Task $task)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if task belongs to a project in a group administered by the current admin
        if ($task->project->group->admin_id !== $user->id) {
            return response()->json(['message' => 'You are not the admin of this task\'s group'], 403);
        }

        if ($task->status !== 'validation') {
            return response()->json(['message' => 'Task must be in validation status'], 422);
        }

        $task->update(['status' => 'en_cours']);

        return response()->json($task->load('project.group', 'assignedUser'));
    }

}
