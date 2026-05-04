import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
          <h1 style={{ color: '#dc2626', fontSize: '24px' }}>⚠️ Application Error</h1>
          <p style={{ color: '#7f1d1d', marginTop: '16px', fontWeight: 'bold' }}>
            {this.state.error?.message}
          </p>
          <pre style={{ marginTop: '16px', padding: '16px', background: '#fee2e2', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', color: '#991b1b' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
