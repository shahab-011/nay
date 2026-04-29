import api from './axios';

export const uploadDocument = (formData, onProgress) =>
  api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

export const uploadTextOnly = (originalName, extractedText, docType = 'Other', jurisdiction = 'Not detected', isPrivate = true) =>
  api.post('/documents/text-only', { originalName, extractedText, docType, jurisdiction, isPrivate });

export const getDocuments = () =>
  api.get('/documents');

export const getDocument = (id) =>
  api.get(`/documents/${id}`);

export const getTextPreview = (id) =>
  api.get(`/documents/${id}/text-preview`);

export const deleteDocument = (id) =>
  api.delete(`/documents/${id}`);

export const updateDocument = (id, updates) =>
  api.put(`/documents/${id}`, updates);

// Annotations
export const getAnnotations    = (docId)              => api.get(`/documents/${docId}/annotations`);
export const createAnnotation  = (docId, data)        => api.post(`/documents/${docId}/annotations`, data);
export const deleteAnnotation  = (docId, annotationId) => api.delete(`/documents/${docId}/annotations/${annotationId}`);
