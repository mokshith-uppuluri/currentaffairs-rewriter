import React, { useState } from 'react';
import { LanguageContent } from '../types';
import { BookOpen, MapPin, ListChecks, FileText, Copy, Check } from 'lucide-react';

interface LanguageCardProps {
  data: LanguageContent;
}

const LanguageCard: React.FC<LanguageCardProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  // Mapping language to a subtle border color for visual distinction
  const borderColorMap: Record<string, string> = {
    Telugu: 'border-blue-200',
    Hindi: 'border-orange-200',
    Kannada: 'border-yellow-200',
    Tamil: 'border-red-200',
    English: 'border-slate-200',
  };

  const badgeColorMap: Record<string, string> = {
    Telugu: 'bg-blue-100 text-blue-800',
    Hindi: 'bg-orange-100 text-orange-800',
    Kannada: 'bg-yellow-100 text-yellow-800',
    Tamil: 'bg-red-100 text-red-800',
    English: 'bg-slate-100 text-slate-800',
  };

  const handleCopy = async () => {
    const textToCopy = [
      data.language,
      "=".repeat(data.language.length),
      "",
      "Context",
      "--------",
      data.context,
      "",
      "Why this news matters",
      "---------------------",
      ...data.significance.map(point => `• ${point}`),
      "",
      "Where and When",
      "--------------",
      ...data.locationAndDate.map(point => `• ${point}`),
      "",
      "Key Points for Exam",
      "-------------------",
      ...data.examPoints.map(point => `• ${point}`)
    ].join('\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${borderColorMap[data.language] || 'border-slate-100'} overflow-hidden transition-all hover:shadow-md mb-6 group`}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-800">{data.language}</h3>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${badgeColorMap[data.language] || 'bg-gray-100'}`}>
            Exam Focus
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100"
          title="Copy content to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Context Section */}
        <section>
          <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h4>Context</h4>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm text-justify">
            {data.context}
          </p>
        </section>

        {/* Significance Section */}
        <section>
          <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h4>Why this news matters</h4>
          </div>
          <ul className="space-y-1.5 pl-1">
            {data.significance.map((point, idx) => (
              <li key={idx} className="text-slate-700 text-sm flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Location and Date Section */}
        <section>
          <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold">
            <MapPin className="w-5 h-5 text-rose-500" />
            <h4>Where and When</h4>
          </div>
          <ul className="space-y-1.5 pl-1">
            {data.locationAndDate.map((point, idx) => (
              <li key={idx} className="text-slate-700 text-sm flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-300 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Exam Points Section */}
        <section>
          <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold">
            <ListChecks className="w-5 h-5 text-amber-500" />
            <h4>Key Points for Exam</h4>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <ul className="space-y-2">
              {data.examPoints.map((point, idx) => (
                <li key={idx} className="text-slate-800 text-sm flex items-start gap-2 font-medium">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LanguageCard;