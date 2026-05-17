import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    project_id: '',
    assigned_to: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    project_id: '',
    assigned_to: ''
  });
  const [editUsers, setEditUsers] = useState([]);
  const [editMembersLoading, setEditMembersLoading] = useState(false);

  const { isAdmin, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  useEffect(() => {
    if (!showViewModal) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowViewModal(false);
        setSelectedTask(null);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showViewModal]);

  useEffect(() => {
    if (!showEditModal) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowEditModal(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showEditModal]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const tasksRes = await api.get('/tasks');
      setTasks(tasksRes.data);

      if (isAdmin) {
        try {
          const projectsRes = await api.get('/projects');
          setProjects(projectsRes.data);
          // users will be loaded dynamically based on selected project
          setUsers([]);
        } catch (error) {
          setError('Failed to load some admin data');
        }
      } else {
        setProjects([]);
        setUsers([]);
      }
    } catch (error) {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const fetchMembersForProject = async (projectId) => {
    if (!projectId) {
      setUsers([]);
      return;
    }

    setMembersLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/members`);
      setUsers(res.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load project members');
      setUsers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'project_id') {
      setFormData({
        ...formData,
        project_id: value,
        // reset assigned user when switching project
        assigned_to: ''
      });
      fetchMembersForProject(value);
      return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/tasks', formData);
      setSuccess('Task created successfully!');
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'medium',
        project_id: '',
        assigned_to: ''
      });
      setUsers([]);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus, taskTitle) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setSuccess(`Task "${taskTitle}" status updated successfully!`);
      setError('');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update task status';
      setError(errorMessage);
    }
  };

  const deleteTask = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the task "${title}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/tasks/${id}`);
        setSuccess('Task deleted successfully!');
        setError('');
        fetchData();
        setTimeout(() => setSuccess(''), 4000);
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete task';
        setError(errorMessage);
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      en_attente: 'bg-warning text-dark',
      en_cours: 'bg-primary',
      validation: 'bg-info text-dark',
      terminee: 'bg-success'
    };
    return classes[status] || 'bg-secondary';
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      high: 'bg-danger',
      medium: 'bg-warning text-dark',
      low: 'bg-secondary'
    };
    return classes[priority] || 'bg-secondary';
  };

  const getMemberStatusOptions = (task) => {
    if (task.status === 'en_attente') {
      return [
        { value: 'en_attente', label: 'En Attente' },
        { value: 'en_cours', label: 'En Cours' }
      ];
    }

    if (task.status === 'en_cours') {
      return [
        { value: 'en_cours', label: 'En Cours' },
        { value: 'validation', label: 'Validation' }
      ];
    }

    return [];
  };

  const getStatusLabel = (status) => {
    const labels = {
      en_attente: 'En Attente',
      en_cours: 'En Cours',
      validation: 'Validation',
      terminee: 'Terminée'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    };
    return labels[priority] || priority;
  };

  const getAssignedMemberName = (task) => {
    return task.assigned_user?.name || task.assignedUser?.name || 'Unassigned';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleValidateTask = async (taskId, taskTitle) => {
    try {
      await api.patch(`/tasks/${taskId}/validate`);
      setSuccess(`Task "${taskTitle}" validated successfully!`);
      setError('');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to validate task');
    }
  };

  const handleReturnTask = async (taskId, taskTitle) => {
    try {
      await api.patch(`/tasks/${taskId}/return`);
      setSuccess(`Task "${taskTitle}" returned successfully!`);
      setError('');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to return task');
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

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      priority: task.priority,
      project_id: task.project_id,
      assigned_to: task.assigned_to
    });
    setEditUsers([]);
    if (task.project_id) {
      fetchMembersForEdit(task.project_id);
    }
    setShowEditModal(true);
  };

  const fetchMembersForEdit = async (projectId) => {
    if (!projectId) {
      setEditUsers([]);
      return;
    }

    setEditMembersLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/members`);
      setEditUsers(res.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load project members');
      setEditUsers([]);
    } finally {
      setEditMembersLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === 'project_id') {
      setEditFormData({
        ...editFormData,
        project_id: value,
        assigned_to: ''
      });
      fetchMembersForEdit(value);
      return;
    }

    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put(`/tasks/${editingTask.id}`, editFormData);
      setSuccess('Task updated successfully!');
      setShowEditModal(false);
      setEditingTask(null);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update task');
    }
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = tasks;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Apply project filter (admin only)
    if (isAdmin && filterProject !== 'all') {
      filtered = filtered.filter(task => task.project_id === parseInt(filterProject));
    }

    // Apply sorting
    let sorted = [...filtered];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (sortBy === 'deadline') {
      sorted.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    }

    return sorted;
  };

  const filteredTasks = getFilteredAndSortedTasks();

  return (
      <div>
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

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading tasks...</p>
          </div>
        ) : (
          <div className="row g-4">
            {/* Create Task Form - Admin Only */}
            {isAdmin && (
              <div className="col-12 col-lg-4">
                <div className="card border-0 shadow-sm rounded-3">
                  <div className="card-header bg-white border-bottom py-3">
                    <h5 className="card-title mb-0">Create Task</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="title" className="form-label">Task Title</label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter task title"
                          required
                          aria-label="Task title"
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
                          placeholder="Describe the task"
                          aria-label="Task description"
                        />
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-12 col-sm-6">
                          <label htmlFor="deadline" className="form-label">Deadline</label>
                          <input
                            type="date"
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className="form-control"
                            aria-label="Task deadline"
                          />
                        </div>
                        <div className="col-12 col-sm-6">
                          <label htmlFor="priority" className="form-label">Priority</label>
                          <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="form-select"
                            aria-label="Task priority"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="project_id" className="form-label">Project</label>
                        <select
                          id="project_id"
                          name="project_id"
                          value={formData.project_id}
                          onChange={handleChange}
                          className="form-select"
                          required
                          aria-label="Select project"
                        >
                          <option value="">Select a project...</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.project_id && (() => {
                        const selectedProject = projects.find(
                          p => p.id === parseInt(formData.project_id)
                        );
                        return selectedProject?.group ? (
                          <div className="mb-3">
                            <label className="form-label">Group</label>
                            <div className="form-control bg-light text-muted" 
                                 style={{ cursor: 'not-allowed' }}>
                              {selectedProject.group.name}
                            </div>
                            <div className="form-text">
                              Only members of this group can be assigned.
                            </div>
                          </div>
                        ) : null;
                      })()}

                      <div className="mb-3">
                        <label htmlFor="assigned_to" className="form-label">Assign To</label>
                        <select
                          id="assigned_to"
                          name="assigned_to"
                          value={formData.assigned_to}
                          onChange={handleChange}
                          className="form-select"
                          required
                          aria-label="Assign task to member"
                          disabled={membersLoading || !formData.project_id}
                        >
                          <option value="">{membersLoading ? 'Loading members...' : !formData.project_id ? 'Select a project first...' : 'Select a member...'}</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
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
                        {loading ? 'Creating...' : 'Create Task'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className={isAdmin ? 'col-12 col-lg-8' : 'col-12'}>
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-white border-bottom py-3">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h5 className="card-title mb-0">
                      {isAdmin ? 'All Tasks' : 'My Assigned Tasks'}
                    </h5>
                  </div>

                  {/* Filter and Sort Controls */}
                  <div className="row g-2">
                    <div className="col-12 col-sm-6 col-md-3">
                      <label htmlFor="filterStatus" className="form-label small mb-1">Status</label>
                      <select
                        id="filterStatus"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="form-select form-select-sm"
                        aria-label="Filter tasks by status"
                      >
                        <option value="all">All</option>
                        <option value="en_attente">Pending</option>
                        <option value="en_cours">In Progress</option>
                        <option value="validation">Validation</option>
                        <option value="terminee">Completed</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <label htmlFor="filterPriority" className="form-label small mb-1">Priority</label>
                      <select
                        id="filterPriority"
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="form-select form-select-sm"
                        aria-label="Filter tasks by priority"
                      >
                        <option value="all">All</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    {isAdmin && (
                      <div className="col-12 col-sm-6 col-md-3">
                        <label htmlFor="filterProject" className="form-label small mb-1">Project</label>
                        <select
                          id="filterProject"
                          value={filterProject}
                          onChange={(e) => setFilterProject(e.target.value)}
                          className="form-select form-select-sm"
                          aria-label="Filter tasks by project"
                        >
                          <option value="all">All Projects</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className={`col-12 col-sm-6 ${isAdmin ? 'col-md-3' : 'col-md-6'}`}>
                      <label htmlFor="sortBy" className="form-label small mb-1">Sort</label>
                      <select
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-select form-select-sm"
                        aria-label="Sort tasks by"
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="deadline">Deadline</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  {filteredTasks.length === 0 ? (
                    tasks.length === 0 ? (
                      <EmptyState
                        title={isAdmin ? "No tasks yet." : "No tasks assigned yet."}
                        message={isAdmin ? "Create your first task and assign it to a member." : "Tasks assigned to you will appear here."}
                        actionLabel={isAdmin ? "Create Task" : undefined}
                        onAction={isAdmin ? () => document.getElementById('title').focus() : undefined}
                      />
                    ) : (
                      <EmptyState
                        title="No results found."
                        message="Try changing your filters or search keywords."
                      />
                    )
                  ) : (
                    <div className="list-group list-group-flush">
                      {filteredTasks.map((task) => (
                        <div key={task.id} className="list-group-item p-3 p-md-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{task.title}</h6>
                              {task.description && (
                                <p className="text-muted small mb-2">{task.description}</p>
                              )}
                              <div className="d-flex flex-wrap gap-3 small text-muted">
                                <span><strong>Project:</strong> {task.project?.name || 'N/A'}</span>
                                <span><strong>Assigned:</strong> {getAssignedMemberName(task)}</span>
                                <span><strong>Deadline:</strong> {formatDate(task.deadline)}</span>
                              </div>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                onClick={() => handleViewTask(task)}
                                className="btn btn-outline-primary btn-sm"
                                aria-label={`View details for ${task.title}`}
                              >
                                View
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className="btn btn-outline-secondary btn-sm"
                                    aria-label={`Edit task ${task.title}`}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteTask(task.id, task.title)}
                                    className="btn btn-outline-danger btn-sm"
                                    aria-label={`Delete task ${task.title}`}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                {getStatusLabel(task.status)}
                              </span>
                              <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                            </div>
                            {isAdmin && task.status === 'validation' ? (
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleValidateTask(task.id, task.title)}
                                >
                                  Validate
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => handleReturnTask(task.id, task.title)}
                                >
                                  Return
                                </button>
                              </div>
                            ) : task.status === 'terminee' ? (
                              <span className="text-muted small">Completed</span>
                            ) : !isAdmin && task.status === 'validation' ? (
                              <span className="badge bg-info text-dark py-2 px-3">Awaiting Validation</span>
                            ) : !isAdmin && task.status === 'en_attente' ? (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => updateTaskStatus(task.id, 'en_cours', task.title)}
                              >
                                Start Task
                              </button>
                            ) : !isAdmin && task.status === 'en_cours' ? (
                              <button
                                type="button"
                                className="btn btn-outline-info btn-sm"
                                onClick={() => updateTaskStatus(task.id, 'validation', task.title)}
                              >
                                Send to Validation
                              </button>
                            ) : (
                              <select
                                value={task.status}
                                onChange={(e) => updateTaskStatus(task.id, e.target.value, task.title)}
                                className="form-select form-select-sm w-auto"
                                aria-label={`Change task status for ${task.title}`}
                              >
                                <>
                                  <option value="en_attente">En Attente</option>
                                  <option value="en_cours">En Cours</option>
                                  <option value="validation">Validation</option>
                                </>
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* View Task Modal */}
      {showViewModal && selectedTask && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          onClick={() => { setShowViewModal(false); setSelectedTask(null); }}
        >
          <div
            className="modal-dialog modal-lg"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Task Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <h6>Title</h6>
                    <p>{selectedTask.title}</p>
                  </div>
                  <div className="col-12">
                    <h6>Description</h6>
                    <p>{selectedTask.description || 'No description provided.'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Project</h6>
                    <p>{selectedTask.project?.name || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Group</h6>
                    <p>{selectedTask.project?.group?.name || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Assigned Member</h6>
                    <p>{getAssignedMemberName(selectedTask)}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Deadline</h6>
                    <p>{formatDate(selectedTask.deadline)}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Priority</h6>
                    <p><span className={`badge ${getPriorityBadgeClass(selectedTask.priority)}`}>{getPriorityLabel(selectedTask.priority)}</span></p>
                  </div>
                  <div className="col-md-6">
                    <h6>Status</h6>
                    <p><span className={`badge ${getStatusBadgeClass(selectedTask.status)}`}>{getStatusLabel(selectedTask.status)}</span></p>
                  </div>
                  {selectedTask.created_at && (
                    <div className="col-md-6">
                      <h6>Created</h6>
                      <p>{new Date(selectedTask.created_at).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedTask.updated_at && (
                    <div className="col-md-6">
                      <h6>Updated</h6>
                      <p>{new Date(selectedTask.updated_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="modal-dialog modal-lg"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Task</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-3">
                    <label htmlFor="editTitle" className="form-label">Task Title</label>
                    <input
                      type="text"
                      id="editTitle"
                      name="title"
                      value={editFormData.title}
                      onChange={handleEditChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editDescription" className="form-label">Description</label>
                    <textarea
                      id="editDescription"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      className="form-control"
                      rows="3"
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="editDeadline" className="form-label">Deadline</label>
                      <input
                        type="date"
                        id="editDeadline"
                        name="deadline"
                        value={editFormData.deadline}
                        onChange={handleEditChange}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="editPriority" className="form-label">Priority</label>
                      <select
                        id="editPriority"
                        name="priority"
                        value={editFormData.priority}
                        onChange={handleEditChange}
                        className="form-select"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label htmlFor="editProject" className="form-label">Project</label>
                      <select
                        id="editProject"
                        name="project_id"
                        value={editFormData.project_id}
                        onChange={handleEditChange}
                        className="form-select"
                        required
                      >
                        <option value="">Select a project...</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="editAssigned" className="form-label">Assign To</label>
                      <select
                        id="editAssigned"
                        name="assigned_to"
                        value={editFormData.assigned_to}
                        onChange={handleEditChange}
                        className="form-select"
                        disabled={editMembersLoading || !editFormData.project_id}
                        required
                      >
                        <option value="">{editMembersLoading ? 'Loading members...' : !editFormData.project_id ? 'Select a project first...' : 'Select a member...'}</option>
                        {editUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Update Task</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showViewModal || showEditModal) && <div className="modal-backdrop show"></div>}
    </div>
  );
};

export default Tasks;
