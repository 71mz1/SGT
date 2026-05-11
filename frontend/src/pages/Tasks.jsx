import React, { useState, useEffect } from 'react';
import api from '../api/axios';

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
  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchDataWithUser(parsedUser);
    } else {
      fetchDataWithUser(null);
    }
  }, []);

  const fetchDataWithUser = async (currentUser) => {
    try {
      setLoading(true);
      const tasksRes = await api.get('/tasks');
      setTasks(tasksRes.data);

      if (currentUser?.role === 'admin') {
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
      fetchDataWithUser(user);
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
      fetchDataWithUser(user);
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
        fetchDataWithUser(user);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const isAdmin = user?.role === 'admin';

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = tasks;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
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
                          disabled={membersLoading}
                        >
                          <option value="">{membersLoading ? 'Loading members...' : 'Select a member...'}</option>
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
                    <div className="col-12 col-sm-6">
                      <label htmlFor="filterStatus" className="form-label small mb-1">Filter by Status</label>
                      <select
                        id="filterStatus"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="form-select form-select-sm"
                        aria-label="Filter tasks by status"
                      >
                        <option value="all">All Statuses</option>
                        <option value="en_attente">Pending</option>
                        <option value="en_cours">In Progress</option>
                        <option value="validation">Validation</option>
                        <option value="terminee">Completed</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <label htmlFor="sortBy" className="form-label small mb-1">Sort by</label>
                      <select
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-select form-select-sm"
                        aria-label="Sort tasks by"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="deadline">By Deadline</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted mb-0">No tasks found</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {filteredTasks.map((task) => (
                        <div key={task.id} className="list-group-item p-3 p-md-4">
                          <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{task.title}</h6>
                              <p className="text-muted small mb-0">{task.description}</p>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => deleteTask(task.id, task.title)}
                                className="btn btn-outline-danger btn-sm"
                                aria-label={`Delete task ${task.title}`}
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          <div className="row g-2 mb-3">
                            <div className="col-12 col-sm-6 col-md-6">
                              <small className="text-muted">Project:</small>
                              <div className="small">{task.project?.name || 'N/A'}</div>
                            </div>
                            <div className="col-12 col-sm-6 col-md-6">
                              <small className="text-muted">Assigned To:</small>
                              <div className="small">{task.assignedUser?.name || 'N/A'}</div>
                            </div>
                            <div className="col-12 col-sm-6 col-md-6">
                              <small className="text-muted">Deadline:</small>
                              <div className="small">{formatDate(task.deadline)}</div>
                            </div>
                            <div className="col-12 col-sm-6 col-md-6">
                              <small className="text-muted">Priority:</small>
                              <div>
                                <span className={`badge ${getPriorityBadgeClass(task.priority)}`} title={`Priority: ${task.priority}`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted">Status:</small>
                              <span className={`badge ${getStatusBadgeClass(task.status)}`} title={`Status: ${task.status}`} aria-label={`Task status: ${task.status === 'en_attente' ? 'Pending' : task.status === 'en_cours' ? 'In Progress' : task.status === 'validation' ? 'Validation' : 'Completed'}`}>
                                {task.status === 'en_attente' ? 'En Attente' :
                                 task.status === 'en_cours' ? 'En Cours' :
                                 task.status === 'validation' ? 'Validation' :
                                 task.status === 'terminee' ? 'Terminée' : task.status}
                              </span>
                            </div>
                            <select
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task.id, e.target.value, task.title)}
                              className="form-select form-select-sm w-auto"
                              disabled={!isAdmin && task.status === 'terminee'}
                              aria-label={`Change task status for ${task.title}`}
                            >
                              <option value="en_attente">En Attente</option>
                              <option value="en_cours">En Cours</option>
                              <option value="validation">Validation</option>
                              {isAdmin && <option value="terminee">Terminée</option>}
                            </select>
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
    </div>
  );
};

export default Tasks;
