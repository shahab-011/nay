import api from './axios';

export const trustApi = {
  // Accounts
  listAccounts:   ()          => api.get('/trust-accounts'),
  createAccount:  (data)      => api.post('/trust-accounts', data),
  updateAccount:  (id, data)  => api.patch(`/trust-accounts/${id}`, data),

  // Ledgers
  getAccountLedger:     (id, params)              => api.get(`/trust-accounts/${id}/ledger`, { params }),
  getMatterLedger:      (id, matterId)            => api.get(`/trust-accounts/${id}/matter-ledger/${matterId}`),
  listTransactions:     (id, params)              => api.get(`/trust-accounts/${id}/transactions`, { params }),
  getReconciliationReport: (id)                   => api.get(`/trust-accounts/${id}/reconciliation-report`),

  // Transactions
  deposit:       (id, data)  => api.post(`/trust-accounts/${id}/deposit`, data),
  disbursement:  (id, data)  => api.post(`/trust-accounts/${id}/disbursement`, data),
  transfer:      (id, data)  => api.post(`/trust-accounts/${id}/transfer`, data),
  refund:        (id, data)  => api.post(`/trust-accounts/${id}/refund`, data),
  voidTx:        (id, txId, reason) => api.patch(`/trust-accounts/${id}/transactions/${txId}/void`, { reason }),

  // Reconciliation
  reconcile: (id, data) => api.post(`/trust-accounts/${id}/reconcile`, data),
};
