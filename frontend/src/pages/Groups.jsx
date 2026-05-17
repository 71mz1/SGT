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
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  const { isAdmin, user, authLoading } = useAuth();

  // Filter groups for member - only show groups where member belongs
  const memberGroups = React.useMemo(() => {
    if (!user) return [];
    return groups.filter(group =>
      group.users?.some(groupUser => groupUser.id === user.id)
    );
  }, [groups, user]);

  // Stats for admin
  const stats = React.useMemo(() => {
    if (!isAdmin) return null;
    const totalGroups = groups.length;
    const totalMembers = new Set(groups.flatMap(g => g.users?.map(u => u.id) || [])).size;
    const emptyGroups = groups.filter(g => !g.users || g.users.length === 0).length;
    return { totalGroups, totalMembers, emptyGroups };
  }, [groups, isAdmin]);

  // Filtered groups for admin search
  const filteredGroups = React.useMemo(() => {
    if (!isAdmin) return groups;
    return groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm, isAdmin]);

  const availableMembers = React.useMemo(() => {
    if (!viewingGroup) return [];
    return users.filter((user) => !viewingGroup.users?.some((member) => member.id === user.id));
  }, [users, viewingGroup]);

  useEffect(() => {
    if (!authLoading) {
      fetchGroups();
      if (isAdmin) {
        fetchUsers();
      }
    }
  }, [authLoading, isAdmin]);

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

  const handleModalAddMember = async (groupId) => {
    if (!addMemberUserId) return;

    setAddMemberLoading(true);
    setModalMessage({ type: '', text: '' });

    try {
      await api.post(`/groups/${groupId}/members`, { user_id: addMemberUserId });
      const addedUser = users.find((user) => user.id === Number(addMemberUserId) || user.id === addMemberUserId);
      setModalMessage({ type: 'success', text: 'Member added successfully.' });
      setAddMemberUserId('');
      fetchGroups();
      setViewingGroup((prev) => prev ? {
        ...prev,
        users: prev.users ? [...prev.users, addedUser] : [addedUser],
      } : prev);
    } catch (error) {
      setModalMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add member' });
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleModalRemoveMember = async (groupId, userId, userName) => {
    if (!window.confirm(`Remove ${userName} from this group?`)) return;

    setModalMessage({ type: '', text: '' });
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
      setModalMessage({ type: 'success', text: `${userName} removed successfully.` });
      fetchGroups();
      setViewingGroup((prev) => prev ? {
        ...prev,
        users: prev.users?.filter((user) => user.id !== userId) || [],
      } : prev);
    } catch (error) {
      setModalMessage({ type: 'error', text: error.response?.data?.message || 'Failed to remove member' });
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

  const openEditModal = (group) => {
    setEditingGroup(group);
    setEditFormData({
      name: group.name,
      description: group.description || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingGroup(null);
    setEditFormData({ name: '', description: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/groups/${editingGroup.id}`, editFormData);
      setSuccess('Group updated successfully!');
      closeEditModal();
      fetchGroups();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (group) => {
    setViewingGroup(group);
    setAddMemberUserId('');
    setModalMessage({ type: '', text: '' });
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingGroup(null);
    setAddMemberUserId('');
    setModalMessage({ type: '', text: '' });
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
          {isAdmin ? (
            <>
              <h1 className="h3 mb-1">Groups Management</h1>
              <p className="text-muted mb-0">Create groups and manage members</p>
            </>
          ) : (
            <>
              <h1 className="h3 mb-1">My Groups</h1>
              <p className="text-muted mb-0">Groups you are assigned to.</p>
            </>
          )}
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
          <>
            {/* Stats Cards */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 text-center">
                  <div className="card-body py-3">
                    <div className="h4 mb-1 text-primary">{stats.totalGroups}</div>
                    <small className="text-muted">Total Groups</small>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 text-center">
                  <div className="card-body py-3">
                    <div className="h4 mb-1 text-success">{stats.totalMembers}</div>
                    <small className="text-muted">Total Members</small>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 text-center">
                  <div className="card-body py-3">
                    <div className="h4 mb-1 text-warning">{stats.emptyGroups}</div>
                    <small className="text-muted">Empty Groups</small>
                  </div>
                </div>
              </div>
            </div>

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
            </div>

            {/* Groups List */}
            <div className="col-12 col-lg-8">
              {/* Search Input */}
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by group name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredGroups.length === 0 ? (
                searchTerm ? (
                  <EmptyState
                    title="No results found."
                    message="Try a different search term."
                  />
                ) : (
                  <EmptyState
                    title="No groups yet."
                    message="Create a group to organize your members and projects."
                    actionLabel="Create Group"
                    onAction={() => document.getElementById('name').focus()}
                  />
                )
              ) : (
                <div className="row g-3">
                  {filteredGroups.map((group) => (
                    <div key={group.id} className="col-12">
                      <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="card-title mb-0">{group.name}</h5>
                            <small className="text-muted">{group.description}</small>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              onClick={() => openViewModal(group)}
                              className="btn btn-outline-primary btn-sm"
                              aria-label={`View group ${group.name}`}
                            >
                              View
                            </button>
                            <button
                              onClick={() => openEditModal(group)}
                              className="btn btn-outline-secondary btn-sm"
                              aria-label={`Edit group ${group.name}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteGroup(group.id, group.name)}
                              className="btn btn-outline-danger btn-sm"
                              aria-label={`Delete group ${group.name}`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <small className="text-muted">Admin:</small>
                            <div className="fw-medium">{group.admin?.name || 'N/A'}</div>
                          </div>

                          <div className="mb-3">
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

                          <div>
                            <small className="text-muted">Projects: {group.projects?.length || 0}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Edit Modal */}
          {showEditModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeEditModal}>
              <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Group</h5>
                    <button type="button" className="btn-close" onClick={closeEditModal}></button>
                  </div>
                  <form onSubmit={handleEditSubmit}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label htmlFor="edit-name" className="form-label">Group Name</label>
                        <input
                          type="text"
                          id="edit-name"
                          className="form-control"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="edit-description" className="form-label">Description</label>
                        <textarea
                          id="edit-description"
                          className="form-control"
                          rows="3"
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Group'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* View Modal */}
          {showViewModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeViewModal}>
              <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{viewingGroup.name}</h5>
                    <button type="button" className="btn-close" onClick={closeViewModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <strong>Description:</strong>
                      <p className="mt-1">{viewingGroup.description || 'No description'}</p>
                    </div>
                    <div className="mb-3">
                      <strong>Admin:</strong>
                      <p className="mt-1">{viewingGroup.admin?.name || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <strong>Members ({viewingGroup.users?.length || 0}):</strong>
                      {viewingGroup.users?.length === 0 ? (
                        <p className="mt-1 text-muted">No members</p>
                      ) : (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {viewingGroup.users.map((user) => (
                            <span key={user.id} className="badge bg-light text-dark border d-flex align-items-center gap-2">
                              {user.name}
                              <button
                                type="button"
                                className="btn-close btn-close-sm"
                                aria-label={`Remove ${user.name}`}
                                onClick={() => handleModalRemoveMember(viewingGroup.id, user.id, user.name)}
                                style={{ fontSize: '0.5rem' }}
                              ></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {modalMessage.type && (
                      <div className={`alert alert-${modalMessage.type === 'success' ? 'success' : 'danger'} py-2`} role="alert">
                        {modalMessage.text}
                      </div>
                    )}

                    <div className="card card-body border-0 rounded-3 mb-3">
                      <div className="mb-3">
                        <strong>Add Member</strong>
                        {availableMembers.length === 0 ? (
                          <p className="mt-2 text-muted mb-0">No available members to add.</p>
                        ) : (
                          <div className="d-flex gap-2 flex-column flex-sm-row">
                            <select
                              className="form-select"
                              value={addMemberUserId}
                              onChange={(e) => setAddMemberUserId(e.target.value)}
                              aria-label="Select member to add"
                            >
                              <option value="">Choose a member...</option>
                              {availableMembers.map((user) => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => handleModalAddMember(viewingGroup.id)}
                              disabled={!addMemberUserId || addMemberLoading}
                            >
                              {addMemberLoading ? 'Adding...' : 'Add Member'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <strong>Projects ({viewingGroup.projects?.length || 0}):</strong>
                      {viewingGroup.projects?.length === 0 ? (
                        <p className="mt-1 text-muted">No projects</p>
                      ) : (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {viewingGroup.projects.map((project) => (
                            <span key={project.id} className="badge bg-primary">
                              {project.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {viewingGroup.created_at && (
                      <div className="mb-3">
                        <strong>Created:</strong>
                        <p className="mt-1">{new Date(viewingGroup.created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeViewModal}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
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
