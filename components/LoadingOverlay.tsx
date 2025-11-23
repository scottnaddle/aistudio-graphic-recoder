import React from 'react';
import { ProcessingState } from '../types';

interface LoadingOverlayProps {
  state: ProcessingState;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ state }) => {
  if (state.status === 'idle' || state.status === 'completed' || state.status === 'error') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-xl border border-indigo-50 max-w-sm w-full text-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Creating Visuals</h3>
          <p className="text-slate-500 animate-pulse">{state.message || 'Processing...'}</p>
        </div>
        
        {/* Progress Steps */}
        <div className="w-full flex gap-2 justify-center mt-2">
          <div className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${state.status === 'summarizing' || state.status === 'drawing' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${state.status === 'drawing' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        </div>
      </div>
    </div>
  );
};