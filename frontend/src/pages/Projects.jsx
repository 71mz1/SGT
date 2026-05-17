import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewProject, setViewProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const { isAdmin, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      fetchProjects();
      if (isAdmin) {
        fetchGroups();
      }
    }
  }, [authLoading, isAdmin]);

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

  const totalTasks = projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0);
  const emptyProjects = projects.filter((project) => !project.tasks?.length).length;
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !groupFilter || project.group?.id === Number(groupFilter);
    return matchesSearch && matchesGroup;
  });

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowViewModal(false);
        setShowEditModal(false);
        setViewProject(null);
        setEditProject(null);
      }
    };

    if (showViewModal || showEditModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showViewModal, showEditModal]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openViewModal = async (project) => {
    try {
      const response = await api.get(`/projects/${project.id}`);
      setViewProject(response.data);
      setShowViewModal(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load project details');
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewProject(null);
  };

  const openEditModal = (project) => {
    setEditProject(project);
    setEditFormData({
      name: project.name || '',
      description: project.description || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditProject(null);
    setEditFormData({ name: '', description: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/projects/${editProject.id}`, editFormData);
      setSuccess('Project updated successfully!');
      closeEditModal();
      fetchProjects();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/projects', formData);
      setSuccess('Project created successfully!');
      setFormData({ name: '', description: '', group_id: '' });
      fetchProjects();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the project "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/projects/${id}`);
        setSuccess('Project deleted successfully!');
        setProjects(projects.filter(project => project.id !== id));
        setTimeout(() => setSuccess(''), 4000);
      } catch (error) {
        setError('Failed to delete project');
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
      <div className="bg-white border-bottom py-4">
        <div className="container">
          {isAdmin ? (
            <>
              <h1 className="h3 mb-1">Projects Management</h1>
              <p className="text-muted mb-0">Create and manage projects linked to your groups.</p>
            </>
          ) : (
            <>
              <h1 className="h3 mb-1">My Projects</h1>
              <p className="text-muted mb-0">Projects from your groups.</p>
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
          <>
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 text-center">
                  <div className="card-body py-3">
                    <div className="h4 mb-1 text-primary">{projects.length}</div>
                    <small className="text-muted">Total Projects</small>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 text-center">
                  <div className="card-body py-3">
                    <div className="h4 mb-1 text-success">{totalTasks}</div>
                    <small className="text-muted">Total Tasks</small>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 text-center">
                  <div className="card-body py-3">
                    <div className="h4 mb-1 text-warning">{emptyProjects}</div>
                    <small className="text-muted">Projects without tasks</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-12 col-lg-4">
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
                          placeholder="Enter project name"
                          required
                          aria-label="Project name"
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
                          placeholder="Describe the project"
                          aria-label="Project description"
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
                          aria-label="Select group for project"
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
                        aria-busy={loading}
                      >
                        {loading ? 'Creating...' : 'Create Project'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-8">
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by project name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search projects"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <select
                      className="form-select"
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value)}
                      aria-label="Filter projects by group"
                    >
                      <option value="">All Groups</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredProjects.length === 0 ? (
                  searchTerm || groupFilter ? (
                    <EmptyState
                      title="No results found."
                      message="Try different search or filter."
                    />
                  ) : (
                    <EmptyState
                      title="No projects yet."
                      message="Create a project and link it to a group."
                      actionLabel="Create Project"
                      onAction={() => document.getElementById('name').focus()}
                    />
                  )
                ) : (
                  <div className="row g-3">
                    {filteredProjects.map((project) => {
                      const completed = project.tasks?.filter((t) => t.status === 'terminee').length || 0;
                      const total = project.tasks?.length || 0;
                      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                      return (
                        <div key={project.id} className="col-12 col-md-6">
                          <div className="card border-0 shadow-sm rounded-3 h-100">
                            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-start gap-3">
                              <div>
                                <h5 className="card-title mb-1">{project.name}</h5>
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                  <span className="badge bg-info text-dark">{project.group?.name || 'No group'}</span>
                                  <span className="badge bg-secondary">{total} tasks</span>
                                </div>
                              </div>
                              <div className="d-flex gap-2 flex-wrap">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => openViewModal(project)}
                                  aria-label={`View project ${project.name}`}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => openEditModal(project)}
                                  aria-label={`Edit project ${project.name}`}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => deleteProject(project.id, project.name)}
                                  aria-label={`Delete project ${project.name}`}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="card-body">
                              <p className="text-muted mb-3">{project.description || 'No description'}</p>
                              <div className="mb-3">
                                <div className="d-flex justify-content-between small text-muted mb-1">
                                  <span>{pct}% complete</span>
                                  <span>{completed}/{total} done</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{ width: `${pct}%` }}
                                    aria-valuenow={pct}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // MEMBER VIEW - Read-only My Projects
          <div className="row g-4">
            <div className="col-12">
              {projects.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div className="mb-2 fs-4">No projects available yet.</div>
                  <p>Projects from your groups will appear here.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {projects.map((project) => {
                    const taskCount = project.tasks?.length || 0;
                    const doneTasks = project.tasks?.filter((t) => t.status === 'terminee').length || 0;
                    const progression = taskCount > 0 ? Math.round((doneTasks / taskCount) * 100) : 0;
                    return (
                      <div key={project.id} className="col-12 col-md-6">
                        <div className="card border-0 shadow-sm rounded-3 h-100">
                          <div className="card-header bg-white border-bottom py-3">
                            <h5 className="card-title mb-0">{project.name}</h5>
                            <small className="text-muted">{project.description || 'No description'}</small>
                          </div>
                          <div className="card-body">
                            <div className="mb-2">
                              <small className="text-muted">Group:</small>
                              <div className="fw-medium">{project.group?.name || 'N/A'}</div>
                            </div>
                            <div className="mb-2">
                              <small className="text-muted">Tasks: {taskCount}</small>
                            </div>
                            <div className="mb-1 d-flex justify-content-between">
                              <small className="text-muted">Progression</small>
                              <small className="fw-medium">{progression}%</small>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${progression}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {showEditModal && editProject && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeEditModal}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Project</h5>
                  <button type="button" className="btn-close" onClick={closeEditModal}></button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="edit-name" className="form-label">Project Name</label>
                      <input
                        type="text"
                        id="edit-name"
                        className="form-control"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Group</label>
                      <input type="text" className="form-control" value={editProject.group?.name || 'N/A'} readOnly />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showViewModal && viewProject && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeViewModal}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{viewProject.name}</h5>
                  <button type="button" className="btn-close" onClick={closeViewModal}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>Description:</strong>
                    <p className="mt-1">{viewProject.description || 'No description'}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Group:</strong>
                    <p className="mt-1">{viewProject.group?.name || 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Tasks ({viewProject.tasks?.length || 0}):</strong>
                    {viewProject.tasks?.length === 0 ? (
                      <p className="mt-1 text-muted">No tasks</p>
                    ) : (
                      <div className="list-group list-group-flush mt-2">
                        {viewProject.tasks.map((task) => (
                          <div key={task.id} className="list-group-item p-3">
                            <div className="d-flex justify-content-between align-items-start gap-3">
                              <div>
                                <div className="fw-semibold">{task.title}</div>
                                <div className="small text-muted mt-1">
                                  Assigned to: {task.assignedUser?.name || 'Unassigned'}
                                </div>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-secondary text-uppercase mb-2">{task.priority || 'Normal'}</span>
                                <div>
                                  <span className={`badge ${task.status === 'terminee' ? 'bg-success' : task.status === 'en cours' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                                    {task.status || 'Pending'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {viewProject.created_at && (
                    <div className="mb-3">
                      <strong>Created:</strong>
                      <p className="mt-1">{new Date(viewProject.created_at).toLocaleDateString()}</p>
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
      </main>
    </div>
  );
};

export default Projects;
