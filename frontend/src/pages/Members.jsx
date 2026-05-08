import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/members', formData);
      setSuccess('Member created successfully!');
      setFormData({
        name: '',
        email: '',
        password: ''
      });
      fetchMembers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await api.delete(`/members/${id}`);
        setSuccess('Member deleted successfully!');
        setMembers(members.filter(member => member.id !== id));
        setTimeout(() => setSuccess(''), 4000);
      } catch (error) {
        setError('Failed to delete member');
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'bg-primary' : 'bg-secondary';
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Page Header */}
      <div className="bg-white border-bottom py-4">
        <div className="container">
          <h1 className="h3 mb-1">Members Management</h1>
          <p className="text-muted mb-0">Create and manage member accounts</p>
        </div>
      </div>

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

        <div className="row g-4">
          {/* Create Member Form */}
          <div className="col-12 col-lg-4">
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

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? (
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

          {/* Members List */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">Members List</h5>
              </div>
              <div className="card-body p-0">
                {members.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted mb-0">No members found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.id}>
                            <td className="fw-medium">{member.name}</td>
                            <td>{member.email}</td>
                            <td>
                              <span className={`badge ${getRoleBadgeClass(member.role)}`} title={`User role: ${member.role}`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                onClick={() => deleteMember(member.id, member.name)}
                                className="btn btn-outline-danger btn-sm"
                                aria-label={`Delete member ${member.name}`}
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
    </div>
  );
};

export default Members;
