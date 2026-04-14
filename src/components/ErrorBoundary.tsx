import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(event.reason);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  const handleReset = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  if (hasError) {
    let errorMessage = "An unexpected error occurred.";
    let isFirestoreError = false;

    try {
      if (error?.message) {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.operationType) {
          errorMessage = `Database Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path || 'unknown path'}`;
          isFirestoreError = true;
        }
      }
    } catch (e) {
      errorMessage = error?.message || errorMessage;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Something went wrong</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {isFirestoreError ? "We encountered a permission or connection issue with the database." : "The application encountered an unexpected error."}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-mono text-slate-600 break-words text-left">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleReset}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              RetailCore Error Recovery System
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
