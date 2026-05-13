import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMember, setViewMember] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });


  useEffect(() => {
    fetchMembers();
  }, []);
useEffect(() => {
  if (!viewMember) return;

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      setViewMember(null);
    }
  };

  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('keydown', handleEscape);
  };
}, [viewMember]);

useEffect(() => {
  if (!editMember) return;

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      setEditMember(null);
      setEditForm({ name: '', email: '', password: '' });
    }
  };

  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('keydown', handleEscape);
  };
}, [editMember]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/members');
      setMembers(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/members', formData);
      setSuccess('Member created successfully!');
      setFormData({ name: '', email: '', password: '' });
      fetchMembers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create member');
    } finally {
      setSaving(false);
    }
  };

  const openViewModal = (member) => {
    setViewMember(member);
  };

  const openEditModal = (member) => {
    setEditMember(member);
    setEditForm({ name: member.name, email: member.email, password: '' });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editMember) return;

    setEditLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      const response = await api.put(`/members/${editMember.id}`, payload);
      setMembers((prev) => prev.map((member) => (member.id === response.data.id ? response.data : member)));
      setSuccess('Member updated successfully!');
      closeEditModal();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update member');
    } finally {
      setEditLoading(false);
    }
  };

  const deleteMember = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await api.delete(`/members/${id}`);
        setSuccess('Member deleted successfully!');
        setMembers((prev) => prev.filter((member) => member.id !== id));
        setTimeout(() => setSuccess(''), 4000);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete member');
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'bg-primary' : 'bg-secondary';
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query);

    const matchesGroup = selectedGroup
      ? member.groups?.some((group) => group.name === selectedGroup)
      : true;

    return matchesSearch && matchesGroup;
  });

  const hasGroupsData = members.some((member) => Object.prototype.hasOwnProperty.call(member, 'groups'));
  const allGroupNames = hasGroupsData
    ? Array.from(new Set(members.flatMap((member) => member.groups?.map((group) => group.name) || [])))
    : [];

  const totalMembers = members.length;
  const membersInGroups = members.filter((member) => member.groups?.length > 0).length;
  const membersWithoutGroups = totalMembers - membersInGroups;

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

  const closeEditModal = () => {
    setEditMember(null);
    setEditForm({ name: '', email: '', password: '' });
  };

  return (
    <div>
      <main className="container py-4">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close alert"></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Close alert"></button>
          </div>
        )}

        <div className="mb-4">
          <h1 className="h3 mb-1">Members</h1>
          <p className="text-muted mb-0">Manage member accounts used for groups and task assignment.</p>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
              <div className="text-muted small mb-2">Total Members</div>
              <div className="fs-3 fw-semibold">{totalMembers}</div>
            </div>
          </div>
          {hasGroupsData && (
            <>
              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
                  <div className="text-muted small mb-2">Members in Groups</div>
                  <div className="fs-3 fw-semibold">{membersInGroups}</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
                  <div className="text-muted small mb-2">Members without Groups</div>
                  <div className="fs-3 fw-semibold">{membersWithoutGroups}</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="row g-4">
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">Create Member Account</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Full name"
                      required
                      aria-label="Member full name"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Email address"
                      required
                      aria-label="Member email address"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Minimum 6 characters"
                      required
                      minLength="6"
                      aria-label="Member password"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={saving} aria-busy={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Member'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">Members Management</h5>
              </div>
              <div className="card-body">
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search members by name or email"
                    />
                  </div>
                  {hasGroupsData && (
                    <div className="col-12 col-md-6">
                      <select
                        className="form-select"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        aria-label="Filter members by group"
                      >
                        <option value="">All groups</option>
                        {allGroupNames.map((groupName) => (
                          <option key={groupName} value={groupName}>
                            {groupName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border" role="status" aria-hidden="true"></div>
                    <div className="mt-3">Loading members...</div>
                  </div>
                ) : members.length === 0 ? (
                  <EmptyState
                    title="No members yet."
                    message="Create member accounts so you can assign tasks."
                    actionLabel="Create Member"
                    onAction={() => document.getElementById('name')?.focus()}
                  />
                ) : filteredMembers.length === 0 ? (
                  <EmptyState
                    title="No results found."
                    message="Try changing your search keywords."
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Groups</th>
                          <th>Role</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((member) => (
                          <tr key={member.id}>
                            <td className="fw-medium">{member.name}</td>
                            <td>{member.email}</td>
                            <td>
                              {member.groups?.length > 0 ? (
                                member.groups.map((group) => (
                                  <span key={group.id} className="badge bg-secondary me-1 mb-1">
                                    {group.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted">No groups</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${getRoleBadgeClass(member.role)}`} title={`User role: ${member.role}`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm me-2"
                                onClick={() => openViewModal(member)}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm me-2"
                                onClick={() => openEditModal(member)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => deleteMember(member.id, member.name)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

{viewMember && (
  <>
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      onClick={() => setViewMember(null)}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Member details</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setViewMember(null)}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body">
            <p><strong>Name:</strong> {viewMember.name}</p>
            <p><strong>Email:</strong> {viewMember.email}</p>
            <p><strong>Role:</strong> {viewMember.role}</p>

            <p><strong>Groups:</strong></p>
            {viewMember.groups?.length > 0 ? (
              <div>
                {viewMember.groups.map((group) => (
                  <span key={group.id} className="badge bg-secondary me-1 mb-1">
                    {group.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-muted">No groups</div>
            )}

            {viewMember.created_at && (
              <p className="mt-3">
                <strong>Created at:</strong>{' '}
                {new Date(viewMember.created_at).toLocaleString()}
              </p>
            )}

            {viewMember.updated_at && (
              <p>
                <strong>Updated at:</strong>{' '}
                {new Date(viewMember.updated_at).toLocaleString()}
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setViewMember(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="modal-backdrop fade show"></div>
  </>
)}

      {editMember && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            onClick={closeEditModal}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Member</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEditModal}
                    aria-label="Close"
                  ></button>
                </div>

                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="edit-name" className="form-label">Name</label>
                      <input
                        type="text"
                        id="edit-name"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="edit-email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="edit-email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="edit-password" className="form-label">
                        Password (leave blank to keep current)
                      </label>
                      <input
                        type="password"
                        id="edit-password"
                        name="password"
                        value={editForm.password}
                        onChange={handleEditChange}
                        className="form-control"
                        placeholder="Leave empty to keep current password"
                        minLength={editForm.password ? 6 : undefined}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={closeEditModal}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={editLoading}
                    >
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default Members;
