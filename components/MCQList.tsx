import React, { useState } from 'react';
import { MCQ } from '../types';
import { Check, X, HelpCircle, Copy, BookOpen, RefreshCw, Trash2, Loader2 } from 'lucide-react';

interface MCQListProps {
  mcqs: MCQ[];
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  regeneratingId: string | null;
}

const MCQList: React.FC<MCQListProps> = ({ mcqs, onDelete, onRegenerate, regeneratingId }) => {
  // Use string ID for state keys instead of index
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const handleOptionClick = (id: string, optionLetter: string) => {
    setSelectedOptions(prev => ({ ...prev, [id]: optionLetter }));
    setShowExplanations(prev => ({ ...prev, [id]: true }));
  };

  const handleCopy = async () => {
    const textToCopy = mcqs.map((mcq, index) => {
      const explanationText = mcq.explanation.map(e => `• ${e}`).join('\n');
      return `Q${index + 1}. ${mcq.question}\n` +
             `A) ${mcq.options[0]}\n` +
             `B) ${mcq.options[1]}\n` +
             `C) ${mcq.options[2]}\n` +
             `D) ${mcq.options[3]}\n` +
             `Correct Answer: ${mcq.correctOption}\n\n` +
             `Explanation:\n${explanationText}\n`;
    }).join('\n-----------------------------------\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!mcqs || mcqs.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
        <p className="text-slate-400 font-medium">No questions available.</p>
        <p className="text-slate-400 text-sm mt-1">Try analyzing new content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-indigo-100 rounded-lg">
             <HelpCircle className="w-5 h-5 text-indigo-600" />
           </div>
           <div>
             <h3 className="font-bold text-slate-800">Practice Quiz</h3>
             <p className="text-xs text-slate-500">{mcqs.length} Questions • UPSC/SSC Level</p>
           </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200 hover:border-indigo-100"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy All</span>
            </>
          )}
        </button>
      </div>

      {mcqs.map((mcq, idx) => {
        const id = mcq.id;
        const userSelected = selectedOptions[id];
        const isRevealed = showExplanations[id];
        const isRegenerating = regeneratingId === id;
        const optionLabels = ['A', 'B', 'C', 'D'];

        return (
          <div key={id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all ${isRegenerating ? 'opacity-70 pointer-events-none' : ''}`}>
            {isRegenerating && (
              <div className="absolute inset-0 z-20 bg-white/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            )}
            
            <div className="p-6 relative">
              <div className="flex gap-4 mb-4 justify-between items-start">
                <div className="flex gap-3 flex-1">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                    {idx + 1}
                  </span>
                  <h4 className="text-lg font-medium text-slate-800 leading-snug pt-1">
                    {mcq.question}
                  </h4>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-1 shrink-0 ml-2">
                  <button 
                    onClick={() => onRegenerate(id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Regenerate Question"
                    disabled={isRegenerating}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={() => onDelete(id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-11">
                {mcq.options.map((option, optIdx) => {
                  const label = optionLabels[optIdx];
                  const isSelected = userSelected === label;
                  const isCorrect = mcq.correctOption === label;
                  
                  let buttonStyle = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700";
                  
                  if (isRevealed) {
                    if (isCorrect) {
                      buttonStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-medium ring-1 ring-emerald-500";
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = "border-red-300 bg-red-50 text-red-800 opacity-60";
                    } else {
                      buttonStyle = "border-slate-100 text-slate-400 opacity-50";
                    }
                  } else if (isSelected) {
                     buttonStyle = "border-indigo-500 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-500";
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleOptionClick(id, label)}
                      disabled={isRevealed || isRegenerating}
                      className={`relative w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-start gap-3 ${buttonStyle}`}
                    >
                      <span className={`text-sm font-bold opacity-80 ${isRevealed && isCorrect ? 'text-emerald-700' : ''}`}>
                        {label})
                      </span>
                      <span className="text-sm">{option}</span>
                      {isRevealed && isCorrect && (
                        <Check className="absolute right-3 top-4 w-5 h-5 text-emerald-600" />
                      )}
                      {isRevealed && isSelected && !isCorrect && (
                        <X className="absolute right-3 top-4 w-5 h-5 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isRevealed && (
                <div className="mt-6 ml-0 md:ml-11 bg-slate-50 rounded-lg p-5 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-3 text-indigo-700 font-semibold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Detailed Explanation</span>
                  </div>
                  
                  <div className="mb-3">
                     <span className="font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded text-xs">
                       Correct Answer: {mcq.correctOption}
                     </span>
                  </div>

                  <ul className="space-y-3">
                    {mcq.explanation.map((point, pIdx) => (
                      <li key={pIdx} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                         <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                         <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MCQList;