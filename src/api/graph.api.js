import api from './axios';

export const getObligationWeb = () =>
  api.get('/graph/obligation-web');
