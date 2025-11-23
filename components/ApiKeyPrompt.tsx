import React from 'react';
import { promptForApiKey } from '../services/geminiService';

interface ApiKeyPromptProps {
  onKeySelected: () => void;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onKeySelected }) => {
  const handleSelectKey = async () => {
    try {
      await promptForApiKey();
      // Assume success and notify parent to re-check
      onKeySelected();
    } catch (e) {
      console.error("Key selection failed or cancelled", e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-indigo-50">
        <div className="h-2 bg-indigo-600 w-full"></div>
        <div className="p-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 9.636a6 6 0 113.637-2.747l-1.069 1.07zm-5 5a1 1 0 102 0 1 1 0 00-2 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Access Required</h2>
          <p className="text-center text-slate-500 mb-8">
            To generate high-quality graphic recordings with Gemini Nano Banana Pro, you need to connect a paid API key.
          </p>

          <button
            onClick={handleSelectKey}
            className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
          >
            Connect Google Cloud API Key
          </button>

          <p className="mt-6 text-xs text-center text-slate-400">
            Learn more about billing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>
          </p>
        </div>
      </div>
    </div>
  );
};