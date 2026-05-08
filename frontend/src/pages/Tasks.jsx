import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
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
  const [user, setUser] = useState(null);

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
          const [projectsRes, usersRes] = await Promise.all([
            api.get('/projects'),
            api.get('/members')
          ]);
          setProjects(projectsRes.data);
          setUsers(usersRes.data.filter(u => u.role === 'member'));
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tasks', formData);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'medium',
        project_id: '',
        assigned_to: ''
      });
      fetchDataWithUser(user);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setError('');
      fetchDataWithUser(user);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update task status';
      setError(errorMessage);
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        setError('');
        fetchDataWithUser(user);
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

  return (
      <div>
      <main className="container py-4">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
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
              <div className="col-lg-4">
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

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label htmlFor="deadline" className="form-label">Deadline</label>
                          <input
                            type="date"
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className="form-control"
                          />
                        </div>
                        <div className="col-6">
                          <label htmlFor="priority" className="form-label">Priority</label>
                          <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="form-select"
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
                        >
                          <option value="">Select a member...</option>
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
                      >
                        {loading ? 'Creating...' : 'Create Task'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className={isAdmin ? 'col-lg-8' : 'col-12'}>
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title mb-0">
                    {isAdmin ? 'All Tasks' : 'My Assigned Tasks'}
                  </h5>
                </div>
                <div className="card-body p-0">
                  {tasks.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted mb-0">No tasks found</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {tasks.map((task) => (
                        <div key={task.id} className="list-group-item p-4">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">{task.title}</h6>
                              <p className="text-muted small mb-0">{task.description}</p>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="btn btn-outline-danger btn-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          <div className="row g-2 mb-3">
                            <div className="col-md-6">
                              <small className="text-muted">Project:</small>
                              <div className="small">{task.project?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted">Assigned To:</small>
                              <div className="small">{task.assignedUser?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted">Deadline:</small>
                              <div className="small">{formatDate(task.deadline)}</div>
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted">Priority:</small>
                              <div>
                                <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted">Status:</small>
                              <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                {task.status === 'en_attente' ? 'En Attente' :
                                 task.status === 'en_cours' ? 'En Cours' :
                                 task.status === 'validation' ? 'Validation' :
                                 task.status === 'terminee' ? 'Terminée' : task.status}
                              </span>
                            </div>
                            <select
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                              className="form-select form-select-sm w-auto"
                              disabled={!isAdmin && task.status === 'terminee'}
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
