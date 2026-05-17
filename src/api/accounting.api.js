import api from './axios';

export const accountingApi = {
  dashboard: () => api.get('/accounting/dashboard'),

  accounts: {
    list:   (params) => api.get('/accounting/accounts', { params }),
    seed:   ()       => api.post('/accounting/accounts/seed'),
    create: (data)   => api.post('/accounting/accounts', data),
    update: (id, d)  => api.put(`/accounting/accounts/${id}`, d),
    remove: (id)     => api.delete(`/accounting/accounts/${id}`),
  },

  entries: {
    list:   (params) => api.get('/accounting/entries', { params }),
    get:    (id)     => api.get(`/accounting/entries/${id}`),
    create: (data)   => api.post('/accounting/entries', data),
    post:   (id)     => api.post(`/accounting/entries/${id}/post`),
    void:   (id, d)  => api.post(`/accounting/entries/${id}/void`, d),
  },

  banks: {
    list:       ()       => api.get('/accounting/banks'),
    connect:    (data)   => api.post('/accounting/banks', data),
    disconnect: (id)     => api.delete(`/accounting/banks/${id}`),
  },

  transactions: {
    list:    (params) => api.get('/accounting/transactions', { params }),
    import:  (data)   => api.post('/accounting/transactions/import', data),
    match:   (id, d)  => api.patch(`/accounting/transactions/${id}/match`, d),
    exclude: (id)     => api.patch(`/accounting/transactions/${id}/exclude`),
    meta:    (id, d)  => api.patch(`/accounting/transactions/${id}/meta`, d),
  },

  reports: {
    pl:           (params) => api.get('/accounting/reports/pl',            { params }),
    balanceSheet: (params) => api.get('/accounting/reports/balance-sheet', { params }),
    trialBalance: ()       => api.get('/accounting/reports/trial-balance'),
    generalLedger:(params) => api.get('/accounting/reports/general-ledger',{ params }),
  },

  reconcile: (data) => api.post('/accounting/reconcile', data),
};
