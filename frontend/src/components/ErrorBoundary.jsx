import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught error:', error, errorInfo);
    // Pass error info to parent callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Something went wrong</h1>
          <p className="text-text-secondary mb-6">An unexpected error occurred. Please try again.</p>
          <button onClick={this.props.onReset} className="px-6 py-2 bg-primary text-on-primary rounded-xl text-font shadow-sm hover:bg-primary-container">
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;