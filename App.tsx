import React, { useState } from 'react';
import { AnalysisResponse, AppState } from './types';
import { analyzeCurrentAffairs, regenerateSingleMCQ, generateMCQBatch } from './services/geminiService';
import LanguageCard from './components/LanguageCard';
import MCQList from './components/MCQList';
import { Sparkles, Eraser, AlertCircle, Send, FileText, CheckSquare, ListPlus } from 'lucide-react';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'mcq'>('content');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  
  // MCQ Generation State
  const [mcqCount, setMcqCount] = useState<string>('5');
  const [isGeneratingMCQs, setIsGeneratingMCQs] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setAppState(AppState.LOADING);
    setError(null);
    setData(null);
    setActiveTab('content'); // Reset to content tab on new search
    setIsGeneratingMCQs(false);

    try {
      const result = await analyzeCurrentAffairs(inputText);
      setData(result);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setAppState(AppState.ERROR);
    }
  };

  const handleClear = () => {
    setInputText('');
    setData(null);
    setError(null);
    setAppState(AppState.IDLE);
    setActiveTab('content');
    setMcqCount('5');
    setIsGeneratingMCQs(false);
  };

  const handleDeleteMCQ = (id: string) => {
    if (!data || !data.mcqs) return;
    setData({
      ...data,
      mcqs: data.mcqs.filter(mcq => mcq.id !== id)
    });
  };

  const handleRegenerateMCQ = async (id: string) => {
    if (!data || !data.mcqs || !inputText) return;
    
    // For regeneration, we should also try to use the English context if available, 
    // otherwise fall back to input text.
    const englishContent = data.results.find(r => r.language === 'English');
    let sourceText = inputText;

    if (englishContent) {
      sourceText = `
Context: ${englishContent.context}
Why this matters: ${englishContent.significance.join('; ')}
Location & Date: ${englishContent.locationAndDate.join('; ')}
Exam Points: ${englishContent.examPoints.join('; ')}
      `;
    }
    
    setRegeneratingId(id);
    try {
      const newMCQ = await regenerateSingleMCQ(sourceText);
      setData(prev => {
        if (!prev || !prev.mcqs) return null;
        return {
          ...prev,
          mcqs: prev.mcqs.map(mcq => mcq.id === id ? newMCQ : mcq)
        };
      });
    } catch (err) {
      console.error("Failed to regenerate MCQ", err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleGenerateQuiz = async () => {
    const count = parseInt(mcqCount, 10);
    if (isNaN(count) || count <= 0 || !data) return;

    // Extract English content from the results to use as source
    const englishContent = data.results.find(r => r.language === 'English');
    let sourceText = inputText;

    if (englishContent) {
      // Reconstruct the structured English content into a string for the AI
      sourceText = `
Context:
${englishContent.context}

Why this news matters:
${englishContent.significance.map(s => `- ${s}`).join('\n')}

Where and When:
${englishContent.locationAndDate.map(l => `- ${l}`).join('\n')}

Key Points for Exam:
${englishContent.examPoints.map(p => `- ${p}`).join('\n')}
      `;
    }

    setIsGeneratingMCQs(true);
    try {
      const newMCQs = await generateMCQBatch(sourceText, count);
      setData(prev => {
         if(!prev) return null;
         return {
             ...prev,
             mcqs: newMCQs
         }
      });
    } catch (err) {
      console.error("Failed to generate quiz batch", err);
      // Could set a temporary error state here for the quiz section
    } finally {
      setIsGeneratingMCQs(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-slate-50 overflow-hidden">
      {/* Left Panel - Input */}
      <div className="w-full md:w-1/3 lg:w-[400px] flex flex-col border-r border-slate-200 bg-white h-[40vh] md:h-screen sticky top-0 z-10 shadow-lg md:shadow-none">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h1 className="text-lg font-bold tracking-tight">CA Rewriter</h1>
          </div>
          <p className="text-slate-300 text-xs">
            Exam-focused current affairs engine.
            Outputs in Telugu, Hindi, Kannada, Tamil, & English.
          </p>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-4">
          <label htmlFor="input-content" className="text-sm font-semibold text-slate-700">
            Source Content (English)
          </label>
          <textarea
            id="input-content"
            className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm leading-relaxed outline-none"
            placeholder="Paste current affairs text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={appState === AppState.LOADING}
          />
          
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              disabled={appState === AppState.LOADING || (!inputText && !data)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-1/3"
            >
              <Eraser className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={handleAnalyze}
              disabled={appState === AppState.LOADING || !inputText.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
            >
              {appState === AppState.LOADING ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Output
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Output */}
      <div className="flex-1 h-[60vh] md:h-screen flex flex-col bg-slate-100/50">
        
        {/* Tab Navigation (Only visible when success) */}
        {appState === AppState.SUCCESS && data && (
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'content'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Rewritten Content
              </button>
              <button
                onClick={() => setActiveTab('mcq')}
                className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'mcq'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Practice MCQs
                {data.mcqs && data.mcqs.length > 0 && <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full">{data.mcqs.length}</span>}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          
          {appState === AppState.IDLE && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium">Ready to rewrite.</p>
              <p className="text-xs">Paste text on the left to begin.</p>
            </div>
          )}

          {appState === AppState.ERROR && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-md text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-red-800 font-semibold mb-1">Processing Error</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {appState === AppState.LOADING && (
            <div className="max-w-3xl mx-auto space-y-6 animate-pulse mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl h-64 w-full shadow-sm border border-slate-200/60 p-6 space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-100 rounded w-4/6"></div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {appState === AppState.SUCCESS && data && (
            <div className="max-w-3xl mx-auto pb-10">
              {activeTab === 'content' ? (
                <>
                  <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-800">Rewritten Content</h2>
                  </div>
                  {data.results.map((item, index) => (
                    <LanguageCard key={index} data={item} />
                  ))}
                  <div className="text-center mt-12 mb-6">
                      <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">End of Content</p>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Generation Controls */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <ListPlus className="w-5 h-5 text-indigo-600" />
                          Generate Practice Quiz
                      </h3>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Number of Questions</label>
                            <input 
                                type="number" 
                                min="1"
                                max="20"
                                value={mcqCount}
                                onChange={(e) => setMcqCount(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                                placeholder="Ex: 5"
                            />
                        </div>
                        <button
                            onClick={handleGenerateQuiz}
                            disabled={isGeneratingMCQs || !mcqCount || parseInt(mcqCount) <= 0}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[50px]"
                        >
                            {isGeneratingMCQs ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate
                                </>
                            )}
                        </button>
                      </div>
                  </div>

                  {/* Results List */}
                  {isGeneratingMCQs && (!data.mcqs || data.mcqs.length === 0) ? (
                     <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <div className="animate-spin mb-3">
                           <Sparkles className="w-8 h-8 text-indigo-300" />
                        </div>
                        <p className="text-sm font-medium">Crafting questions...</p>
                     </div>
                  ) : (
                    <MCQList 
                      mcqs={data.mcqs || []} 
                      onDelete={handleDeleteMCQ}
                      onRegenerate={handleRegenerateMCQ}
                      regeneratingId={regeneratingId}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;