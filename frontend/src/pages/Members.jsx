import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      await api.post('/members', formData);
      setFormData({
        name: '',
        email: '',
        password: '',
        
      });
      fetchMembers();
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create member');
      setLoading(false);
    }
  };

  const deleteMember = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await api.delete(`/members/${id}`);
        setMembers(members.filter(member => member.id !== id));
      } catch (error) {
        // Silent error handling
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'bg-primary' : 'bg-secondary';
  };

  return (
    
      <div>

      <main className="container py-4">
        <div className="row g-4">
          {/* Create Member Form */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">Create Member Account</h5>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                  </div>
                )}

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
                      required
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
                      required
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
                      required
                      minLength="6"
                    />
                  </div>

                 
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
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
          <div className="col-lg-8">
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
                              <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                onClick={() => deleteMember(member.id)}
                                className="btn btn-outline-danger btn-sm"
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
