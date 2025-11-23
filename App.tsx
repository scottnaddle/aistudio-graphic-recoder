import React, { useState, useEffect, useCallback } from 'react';
import { ApiKeyPrompt } from './components/ApiKeyPrompt';
import { LoadingOverlay } from './components/LoadingOverlay';
import { checkApiKey, summarizeToVisualPrompt, generateGraphicRecording, promptForApiKey } from './services/geminiService';
import { ProcessingState, GenerationResult } from './types';

export default function App() {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });

  // Initial Key Check
  useEffect(() => {
    checkApiKey().then(setHasKey);
  }, []);

  const handleKeySelected = async () => {
    // According to guidelines, assume success after triggering openSelectKey
    // But we can re-verify nicely.
    setHasKey(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    // Double check key existence right before call, or try to prompt if missing (though UI handles this mostly)
    if (!hasKey) {
        await promptForApiKey();
        setHasKey(true);
    }

    setResult(null);
    setProcessingState({ status: 'summarizing', message: 'Analyzing text and extracting key concepts...' });

    try {
      // Step 1: Summarize
      const analysis = await summarizeToVisualPrompt(inputText);
      
      setProcessingState({ status: 'drawing', message: `Sketching your graphic recording in ${analysis.detectedLanguage}...` });

      // Step 2: Draw
      const imageUrl = await generateGraphicRecording(analysis.visualPrompt, analysis.detectedLanguage);

      setResult({
        summary: analysis.summaryPoints,
        imageUrl: imageUrl
      });
      setProcessingState({ status: 'completed' });

    } catch (error: any) {
      console.error(error);
      let errorMessage = "An error occurred during generation.";
      if (error.message.includes("Requested entity was not found")) {
         errorMessage = "API Key error. Please reconnect your key.";
         setHasKey(false); // Reset key state to force re-selection
      } else {
         errorMessage = error.message || errorMessage;
      }
      setProcessingState({ status: 'error', message: errorMessage });
    }
  };

  if (!hasKey) {
    return <ApiKeyPrompt onKeySelected={handleKeySelected} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <LoadingOverlay state={processingState} />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Graphic Recorder <span className="text-indigo-600">AI</span></h1>
          </div>
          <button 
             onClick={() => setHasKey(false)}
             className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Switch API Key
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* Intro Section */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Turn words into visual stories</h2>
          <p className="text-lg text-slate-600">
            Paste your text or upload a document. We'll summarize it and create a beautiful graphic recording sketchnote instantly.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-1 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto">
             <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Input Source</div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 placeholder:text-slate-400 mb-4"
              placeholder="Paste your article, meeting notes, or script here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative group">
                 <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  Upload Text File (.txt, .md)
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!inputText.trim() || processingState.status !== 'idle' && processingState.status !== 'completed' && processingState.status !== 'error'}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
              >
                Generate Graphic Recording
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {processingState.status === 'error' && (
           <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p>{processingState.message}</p>
           </div>
        )}

        {result && (
          <div className="grid md:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Summary Column */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100 shadow-sm relative rotate-1 transform transition-transform hover:rotate-0">
                <div className="absolute -top-3 left-6 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Key Takeaways
                </div>
                <ul className="space-y-4 font-hand text-lg text-slate-800 mt-2">
                  {result.summary.map((point, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-yellow-600 text-2xl leading-none">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Image Column */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                 {result.imageUrl ? (
                  <div className="relative group">
                    <img 
                      src={result.imageUrl} 
                      alt="Graphic Recording" 
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-end p-4">
                       <a 
                         href={result.imageUrl} 
                         download="graphic-recording.png"
                         className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-4 py-2 rounded-lg font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2"
                       >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         Download
                       </a>
                    </div>
                  </div>
                 ) : (
                   <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400">
                     Image failed to load
                   </div>
                 )}
              </div>
              <p className="text-center text-slate-400 text-sm mt-3">
                Generated with Gemini Nano Banana Pro (v3 Image Preview)
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}