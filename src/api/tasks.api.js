import api from './axios';

export const tasksApi = {
  list:       (params)     => api.get('/tasks', { params }),
  get:        (id)         => api.get(`/tasks/${id}`),
  create:     (data)       => api.post('/tasks', data),
  update:     (id, data)   => api.patch(`/tasks/${id}`, data),
  remove:     (id)         => api.delete(`/tasks/${id}`),
  complete:   (id)         => api.patch(`/tasks/${id}/complete`),
  reopen:     (id)         => api.patch(`/tasks/${id}/reopen`),
  reorder:    (items)      => api.patch('/tasks/reorder', { items }),
  bulkCreate: (data)       => api.post('/tasks/bulk', data),
  myTasks:    (params)     => api.get('/tasks/my-tasks', { params }),
  overdue:    ()           => api.get('/tasks/overdue'),

  listTaskLists:  (params)     => api.get('/task-lists', { params }),
  createTaskList: (data)       => api.post('/task-lists', data),
  updateTaskList: (id, data)   => api.put(`/task-lists/${id}`, data),
  deleteTaskList: (id)         => api.delete(`/task-lists/${id}`),
  applyTemplate:  (id, data)   => api.post(`/task-lists/${id}/apply-to-matter`, data),
};
