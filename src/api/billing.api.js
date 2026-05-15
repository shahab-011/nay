import api from './axios';

export const billingApi = {
  // Invoices
  listInvoices:   (params) => api.get('/invoices', { params }),
  getInvoice:     (id)     => api.get(`/invoices/${id}`),
  createInvoice:  (data)   => api.post('/invoices', data),
  updateInvoice:  (id, d)  => api.patch(`/invoices/${id}`, d),
  deleteInvoice:  (id)     => api.delete(`/invoices/${id}`),
  sendInvoice:    (id)     => api.post(`/invoices/${id}/send`),
  markPaid:       (id, d)  => api.post(`/invoices/${id}/mark-paid`, d),
  generateFromMatter: (matterId) => api.post(`/invoices/generate`, { matterId }),

  // Payment links
  createPaymentLink: (invoiceId) => api.post(`/invoices/${invoiceId}/payment-link`),

  // Trust
  listTrustAccounts:  ()               => api.get('/trust-accounts'),
  trustDeposit:       (accountId, data) => api.post(`/trust-accounts/${accountId}/deposit`, data),
  trustTransfer:      (accountId, data) => api.post(`/trust-accounts/${accountId}/transfer`, data),
  reconciliation:     (accountId, params) => api.get(`/trust-accounts/${accountId}/reconciliation`, { params }),
  listTransactions:   (accountId, params) => api.get(`/trust-accounts/${accountId}/transactions`, { params }),
};
