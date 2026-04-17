import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UploadDocument from './pages/UploadDocument';
import MyDocuments from './pages/MyDocuments';
import Analysis from './pages/Analysis';
import CompareDocuments from './pages/CompareDocuments';
import ContractLifecycle from './pages/ContractLifecycle';
import AskAI from './pages/AskAI';
import Alerts from './pages/Alerts';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadDocument />} />
          <Route path="/documents" element={<MyDocuments />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/ask" element={<AskAI />} />
          <Route path="/compare" element={<CompareDocuments />} />
          <Route path="/lifecycle" element={<ContractLifecycle />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
