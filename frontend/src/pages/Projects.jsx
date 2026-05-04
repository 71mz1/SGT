import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchGroups();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
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
      await api.post('/projects', formData);
      setFormData({ name: '', description: '', group_id: '' });
      fetchProjects();
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create project');
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${id}`);
        setProjects(projects.filter(project => project.id !== id));
      } catch (error) {
        // Silent error handling
      }
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Page Header */}
      <div className="bg-white border-bottom py-4">
        <div className="container">
          <h1 className="h3 mb-1">Projects Management</h1>
          <p className="text-muted mb-0">Create and manage projects</p>
        </div>
      </div>

      <main className="container py-4">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <div className="row g-4">
          {/* Create Project Form */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">Create Project</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Project Name</label>
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
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="form-control"
                      rows="3"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="group_id" className="form-label">Select Group</label>
                    <select
                      id="group_id"
                      name="group_id"
                      value={formData.group_id}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Choose a group...</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Projects List */}
          <div className="col-lg-8">
            {projects.length === 0 ? (
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body text-center py-5">
                  <p className="text-muted mb-0">No projects found</p>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {projects.map((project) => (
                  <div key={project.id} className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-3 h-100">
                      <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">{project.name}</h5>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="card-body">
                        <p className="text-muted mb-3">{project.description || 'No description'}</p>
                        <div className="small">
                          <div className="mb-1">
                            <span className="text-muted">Group:</span>{' '}
                            <span className="fw-medium">{project.group?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted">Tasks:</span>{' '}
                            <span className="badge bg-secondary">{project.tasks?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Projects;
