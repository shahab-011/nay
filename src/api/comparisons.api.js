import api from './axios';

export const compareDocuments = (docAId, docBId) =>
  api.post('/comparisons', { docAId, docBId });

export const getComparisons = () =>
  api.get('/comparisons');

export const getComparison = (id) =>
  api.get(`/comparisons/${id}`);
