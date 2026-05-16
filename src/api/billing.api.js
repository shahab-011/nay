import api from './axios';

export const billingApi = {
  // Invoices
  listInvoices:    (params)      => api.get('/invoices', { params }),
  getInvoice:      (id)          => api.get(`/invoices/${id}`),
  createInvoice:   (data)        => api.post('/invoices', data),
  updateInvoice:   (id, data)    => api.patch(`/invoices/${id}`, data),
  deleteInvoice:   (id)          => api.delete(`/invoices/${id}`),
  sendInvoice:     (id)          => api.post(`/invoices/${id}/send`),
  markPaid:        (id, data)    => api.post(`/invoices/${id}/mark-paid`, data),
  voidInvoice:     (id, reason)  => api.post(`/invoices/${id}/void`, { reason }),
  writeOff:        (id, data)    => api.post(`/invoices/${id}/write-off`, data),
  sendReminder:    (id)          => api.post(`/invoices/${id}/reminder`),
  issueCreditNote: (id, data)    => api.post(`/invoices/${id}/credit-note`, data),
  createPaymentPlan: (id, data)  => api.post(`/invoices/${id}/payment-plan`, data),

  generateFromMatter: (data)     => api.post('/invoices/generate', data),
  batchGenerate:      (data)     => api.post('/invoices/batch-generate', data),
  generatePaymentLink:(id)       => api.post(`/invoices/${id}/payment-link`),

  // Credit notes
  listCreditNotes: ()            => api.get('/credit-notes'),

  // Trust accounting
  listTrustAccounts:  ()                    => api.get('/trust-accounts'),
  trustDeposit:       (accountId, data)     => api.post(`/trust-accounts/${accountId}/deposit`, data),
  trustTransfer:      (accountId, data)     => api.post(`/trust-accounts/${accountId}/transfer`, data),
  reconciliation:     (accountId, params)   => api.get(`/trust-accounts/${accountId}/reconciliation`, { params }),
};
