import api from './axios';

export const practiceDocsApi = {
  // Documents
  list:       (params)     => api.get('/practice-docs', { params }),
  get:        (id)         => api.get(`/practice-docs/${id}`),
  upload:     (formData)   => api.post('/practice-docs/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:     (id, data)   => api.put(`/practice-docs/${id}`, data),
  remove:     (id)         => api.delete(`/practice-docs/${id}`),
  download:   (id)         => api.get(`/practice-docs/${id}/download`),
  preview:    (id)         => api.get(`/practice-docs/${id}/preview`),
  bulkMove:   (data)       => api.post('/practice-docs/bulk-move', data),

  // Versions
  uploadVersion: (id, formData) => api.post(`/practice-docs/${id}/versions`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listVersions:  (id)           => api.get(`/practice-docs/${id}/versions`),
  restoreVersion:(id, versionId)=> api.post(`/practice-docs/${id}/restore/${versionId}`),
  share:         (id, data)     => api.post(`/practice-docs/${id}/share`, data),

  // Folders
  listFolders:  (params)     => api.get('/folders', { params }),
  createFolder: (data)       => api.post('/folders', data),
  renameFolder: (id, data)   => api.put(`/folders/${id}`, data),
  deleteFolder: (id)         => api.delete(`/folders/${id}`),

  // Document Requests
  listRequests:  (params)   => api.get('/document-requests', { params }),
  createRequest: (data)     => api.post('/document-requests', data),
  fulfilRequest: (id, data) => api.patch(`/document-requests/${id}/fulfil`, data),
};
