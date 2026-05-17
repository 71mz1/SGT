<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GroupController extends Controller
{
    public function index(Request $request)
    {
         /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user->role === 'admin') {
            $groups = Group::where('admin_id', $user->id)->with('admin', 'users', 'projects')->get();
        } else {
            $groups = $user->groups()->with('admin', 'users', 'projects')->get();
        }
        
        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $group = Group::create([
            'name' => $request->name,
            'description' => $request->description,
            'admin_id' => $user->id,
        ]);

        return response()->json($group, 201);
    }

    public function show(Group $group)
    {
         /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check if user is admin or member of the group
        if ($user->role !== 'admin' && !$user->groups()->where('groups.id', $group->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($group->load('admin', 'users', 'projects'));
    }

    public function addMember(Request $request, Group $group)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = Auth::user();
        
        // Only admin can add members
        if ($user->role !== 'admin' || $group->admin_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $member = User::findOrFail($request->user_id);
        
        // Check if user is already a member
        if ($group->users()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'User is already a member'], 422);
        }

        $group->users()->attach($request->user_id);

        return response()->json(['message' => 'Member added successfully']);
    }

    public function removeMember(Group $group, User $user)
    {
        $authUser = Auth::user();
        
        // Only admin can remove members
        if ($authUser->role !== 'admin' || $group->admin_id !== $authUser->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Cannot remove the admin
        if ($group->admin_id === $user->id) {
            return response()->json(['message' => 'Cannot remove group admin'], 422);
        }

        $group->users()->detach($user->id);

        return response()->json(['message' => 'Member removed successfully']);
    }

    public function update(Request $request, Group $group)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $user = Auth::user();
        
        if ($user->role !== 'admin' || $group->admin_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $group->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json($group->load('admin', 'users', 'projects'));
    }

    public function destroy(Group $group)
    {
        $user = Auth::user();
        
        if ($user->role !== 'admin' || $group->admin_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if group has projects
        if ($group->projects()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a group that has associated projects. Remove projects first.'], 422);
        }

        // Detach all members
        $group->users()->detach();

        // Delete the group
        $group->delete();

        return response()->json(['message' => 'Group deleted successfully']);
    }
}
