<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            $projects = Project::whereHas('group', function ($q) use ($user) {
                $q->where('admin_id', $user->id);
            })->with('group', 'tasks')->get();
        } else {
            // Members can only see projects from their groups
            $projects = Project::whereHas('group.users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->with('group', 'tasks')->get();
        }

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'group_id' => 'required|exists:groups,id',
        ]);

        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $group = Group::findOrFail($request->group_id);

        if ($group->admin_id !== $user->id) {
            return response()->json(['message' => 'You are not the admin of this group'], 403);
        }

        $project = Project::create([
            'name' => $request->name,
            'description' => $request->description,
            'group_id' => $request->group_id,
        ]);

        return response()->json($project->load('group'), 201);
    }

    public function show(Project $project)
    {
        $user = Auth::user();

        $canAccess = $user->role === 'admin'
            || Group::where('id', $project->group_id)
                ->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })
                ->exists();

        if (!$canAccess) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($project->load('group', 'tasks.assignedUser'));
    }

    public function update(Request $request, Project $project)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($project->group->admin_id !== $user->id) {
            return response()->json(['message' => 'You are not the admin of this project group'], 403);
        }

        $project->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json($project->load('group'));
    }

    public function destroy(Project $project)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($project->group->admin_id !== $user->id) {
            return response()->json(['message' => 'You are not the admin of this project group'], 403);
        }

        if ($project->tasks()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete a project that has tasks. Remove tasks first.'
            ], 422);
        }

        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
    }

    public function members(Project $project)
    {
        $user = Auth::user();

        $canAccess = $user->role === 'admin'
            || Group::where('id', $project->group_id)
                ->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })
                ->exists();

        if (!$canAccess) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $members = $project->group
            ->users()
            ->where('role', 'member')
            ->get();

        return response()->json($members);
    }
}