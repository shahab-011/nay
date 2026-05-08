import api from './axios';

export const getCollaborators = (docId) =>
  api.get(`/collaboration/${docId}/collaborators`);

export const updatePresence = (docId, clauseIndex) =>
  api.post(`/collaboration/${docId}/presence`, { currentClause: clauseIndex });
