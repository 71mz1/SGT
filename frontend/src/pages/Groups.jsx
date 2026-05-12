import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [memberData, setMemberData] = useState({
    user_id: ''
  });

  const { isAdmin, user, authLoading } = useAuth();

  // Filter groups for member - only show groups where member belongs
  const memberGroups = React.useMemo(() => {
    if (!user) return [];
    return groups.filter(group =>
      group.users?.some(groupUser => groupUser.id === user.id)
    );
  }, [groups, user]);

  useEffect(() => {
    if (!authLoading) {
      fetchGroups();
      fetchUsers();
    }
  }, [authLoading]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/members');
      setUsers(response.data.filter(user => user.role === 'member'));
    } catch (error) {
      // Silent error handling
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/groups', formData);
      setSuccess('Group created successfully!');
      setFormData({ name: '', description: '' });
      fetchGroups();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedGroup || !memberData.user_id) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/groups/${selectedGroup}/members`, memberData);
      setSuccess('Member added to group successfully!');
      setMemberData({ user_id: '' });
      setSelectedGroup('');
      fetchGroups();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the group "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/groups/${id}`);
        setSuccess('Group deleted successfully!');
        setGroups(groups.filter(group => group.id !== id));
        setTimeout(() => setSuccess(''), 4000);
      } catch (error) {
        setError('Failed to delete group');
      }
    }
  };

  const removeMember = async (groupId, userId, memberName, groupName) => {
    if (window.confirm(`Remove ${memberName} from "${groupName}"?`)) {
      try {
        await api.delete(`/groups/${groupId}/members/${userId}`);
        setSuccess(`${memberName} removed from group successfully!`);
        fetchGroups();
        setTimeout(() => setSuccess(''), 4000);
      } catch (error) {
        setError('Failed to remove member');
      }
    }
  };

  const EmptyState = ({ title, message, actionLabel, onAction }) => (
    <div className="text-center py-5 text-muted">
      <div className="mb-2 fs-4">{title}</div>
      <p className="mb-3">{message}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-vh-100 bg-light">
      {/* Page Header */}
      <div className="bg-white border-bottom py-4">
        <div className="container">
          <h1 className="h3 mb-1">Groups Management</h1>
          <p className="text-muted mb-0">Create groups and manage members</p>
        </div>
      </div>

      <main className="container py-4">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close alert"></button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Close alert"></button>
          </div>
        )}

        {isAdmin ? (
          // ADMIN VIEW - Full Groups Management
          <div className="row g-4">
            {/* Create Group Form */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title mb-0">Create Group</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Group Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-control"
                        placeholder="Enter group name"
                        required
                        aria-label="Group name"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="form-control"
                        rows="3"
                        placeholder="Describe the group purpose"
                        aria-label="Group description"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={loading}
                      aria-busy={loading}
                    >
                      {loading ? 'Creating...' : 'Create Group'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Add Member Form */}
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title mb-0">Add Member to Group</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddMember}>
                    <div className="mb-3">
                      <label className="form-label">Select Group</label>
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="form-select"
                        required
                        aria-label="Select group to add member to"
                      >
                        <option value="">Choose a group...</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Select Member</label>
                      <select
                        value={memberData.user_id}
                        onChange={(e) => setMemberData({ user_id: e.target.value })}
                        className="form-select"
                        required
                        aria-label="Select member to add to group"
                      >
                        <option value="">Choose a member...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedGroup || !memberData.user_id || loading}
                      className="btn btn-success w-100"
                      aria-busy={loading}
                    >
                      {loading ? 'Adding...' : 'Add to Group'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Groups List */}
            <div className="col-12 col-lg-8">
              {groups.length === 0 ? (
                <EmptyState
                  title="No groups yet."
                  message="Create a group to organize your members and projects."
                  actionLabel="Create Group"
                  onAction={() => document.getElementById('name').focus()}
                />
              ) : (
                <div className="row g-3">
                  {groups.map((group) => (
                    <div key={group.id} className="col-12">
                      <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="card-title mb-0">{group.name}</h5>
                            <small className="text-muted">{group.description}</small>
                          </div>
                          <button
                            onClick={() => deleteGroup(group.id, group.name)}
                            className="btn btn-outline-danger btn-sm"
                            aria-label={`Delete group ${group.name}`}
                          >
                            Delete
                          </button>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <small className="text-muted">Admin:</small>
                            <div className="fw-medium">{group.admin?.name || 'N/A'}</div>
                          </div>

                          <div>
                            <small className="text-muted">Members:</small>
                            {group.users?.length === 0 ? (
                              <p className="text-muted small mb-0">No members in this group</p>
                            ) : (
                              <div className="d-flex flex-wrap gap-2 mt-2">
                                {group.users?.map((user) => (
                                  <span key={user.id} className="badge bg-light text-dark border d-flex align-items-center gap-2">
                                    {user.name}
                                    <button
                                      onClick={() => removeMember(group.id, user.id, user.name, group.name)}
                                      className="btn-close btn-close-sm"
                                      style={{ fontSize: '0.5rem' }}
                                      aria-label={`Remove ${user.name} from ${group.name}`}
                                    ></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // MEMBER VIEW - Read-only My Groups
          <div className="row g-4">
            <div className="col-12">
              {memberGroups.length === 0 ? (
                <EmptyState
                  title="You are not assigned to any group yet."
                  message="Groups assigned to you will appear here."
                />
              ) : (
                <div className="row g-3">
                  {memberGroups.map((group) => (
                    <div key={group.id} className="col-12 col-md-6">
                      <div className="card border-0 shadow-sm rounded-3 h-100">
                        <div className="card-header bg-white border-bottom py-3">
                          <h5 className="card-title mb-0">{group.name}</h5>
                          <small className="text-muted">{group.description}</small>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <small className="text-muted">Group Admin:</small>
                            <div className="fw-medium">{group.admin?.name || 'N/A'}</div>
                          </div>

                          <div>
                            <small className="text-muted">Members ({group.users?.length || 0}):</small>
                            {group.users?.length === 0 ? (
                              <p className="text-muted small mb-0">No members in this group</p>
                            ) : (
                              <div className="d-flex flex-wrap gap-2 mt-2">
                                {group.users?.map((user) => (
                                  <span
                                    key={user.id}
                                    className="badge bg-light text-dark border"
                                    aria-label={`Member: ${user.name}`}
                                  >
                                    {user.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {group.projects && group.projects.length > 0 && (
                            <div className="mt-3 pt-3 border-top">
                              <small className="text-muted">Related Projects ({group.projects.length}):</small>
                              <div className="d-flex flex-wrap gap-2 mt-2">
                                {group.projects.map((project) => (
                                  <span
                                    key={project.id}
                                    className="badge bg-primary"
                                    aria-label={`Project: ${project.name}`}
                                  >
                                    {project.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Groups;
