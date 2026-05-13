<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    /**
     * Get all members (only for admin)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $members = User::where('role', 'member')
            ->with('groups')
            ->latest()
            ->get();
        
        return response()->json($members);
    }

    /**
     * Create a new member (only for admin)
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $member = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'role' => 'member',
        ]);

        return response()->json($member, 201);
    }

    /**
     * Update member details (only for admin)
     */
    public function update(Request $request, User $user)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role !== 'member') {
            return response()->json(['message' => 'Cannot edit admin users'], 422);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = $data['name'];
        $user->email = $data['email'];

        if (! empty($data['password'])) {
            $user->password = bcrypt($data['password']);
        }

        $user->save();
        $user->load('groups');

        return response()->json($user);
    }

    /**
     * Delete a member (only for admin)
     */
    public function destroy(User $user)
    {
        $authUser = Auth::user();
        
        if ($authUser->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role !== 'member') {
            return response()->json(['message' => 'Cannot delete admin users'], 422);
        }

        if ($user->assignedTasks()->exists()) {
            return response()->json(['message' => 'Cannot delete member with assigned tasks.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Member deleted successfully']);
    }
}
