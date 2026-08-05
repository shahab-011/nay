import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo);
    
    // Auto-recover once from dynamic module script/chunk fetch errors after deployment updates
    const isChunkError = error?.name === 'ChunkLoadError' || 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    if (isChunkError && !sessionStorage.getItem('nyaya_chunk_retry')) {
      sessionStorage.setItem('nyaya_chunk_retry', 'true');
      window.location.reload();
    }
  }

  handleReset = () => {
    sessionStorage.removeItem('nyaya_chunk_retry');
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#070514',
          color: '#f0eeff',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 16,
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
            Something went wrong displaying this page
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(240, 238, 255, 0.6)', maxWidth: 420, lineHeight: 1.5, marginBottom: 20 }}>
            An unexpected render error occurred. Please click below to refresh and reload your workspace safely.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 22px', borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              border: 'none', color: '#fff',
              fontSize: 13.5, fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(124, 58, 237, 0.4)',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
