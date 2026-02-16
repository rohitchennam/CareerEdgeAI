
import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { ResumeAnalysis } from '../types';

interface Props {
  data: ResumeAnalysis;
  onStartInterview: () => void;
}

const AnalysisDashboard: React.FC<Props> = ({ data, onStartInterview }) => {
  if (!data || !data.metrics) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
        Analysis data is incomplete. Please try uploading again.
      </div>
    );
  }

  const radarData = [
    { subject: 'Formatting', A: data.metrics.formatting || 0, fullMark: 100 },
    { subject: 'Content', A: data.metrics.contentQuality || 0, fullMark: 100 },
    { subject: 'ATS', A: data.metrics.atsCompatibility || 0, fullMark: 100 },
    { subject: 'Keywords', A: data.metrics.keywordUsage || 0, fullMark: 100 },
  ];

  const getColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getMatchColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-10 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">ATS Optimization Score</h3>
          <div className={`text-8xl font-black mt-4 tracking-tighter ${getColorClass(data.atsScore)}`}>
            {data.atsScore}<span className="text-3xl text-slate-300">/100</span>
          </div>
          <p className="mt-6 text-slate-500 italic text-sm leading-relaxed px-4">"{data.executiveSummary}"</p>
        </div>

        <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
          <h3 className="text-slate-800 font-black text-xl mb-8">Metric Deep-Dive</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <Radar 
                  name="Score" 
                  dataKey="A" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fill="#4f46e5" 
                  fillOpacity={0.4} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* JD Match Section (Conditional) */}
      {data.jdMatch && (
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-indigo-100 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle 
                    cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - (data.jdMatch.matchPercentage || 0) / 100)}
                    className={`${getMatchColor(data.jdMatch.matchPercentage)} transition-all duration-1000`} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900">{data.jdMatch.matchPercentage}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">JD Match</span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Job Suitability Report</h3>
                <p className="text-slate-600 mt-2 leading-relaxed">{data.jdMatch.suitabilityFeedback}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Missing Critical Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {data.jdMatch.missingKeywords.map(kw => (
                    <span key={kw} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-100">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Recommendation */}
      <div className="bg-indigo-600 text-white p-12 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div className="flex-1 relative z-10">
          <span className="bg-indigo-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-4 inline-block">Career Compass Recommendation</span>
          <h2 className="text-5xl font-black mt-2 tracking-tight">{data.recommendedDomain.title}</h2>
          <p className="mt-6 text-indigo-100 text-xl font-medium leading-relaxed max-w-2xl">{data.recommendedDomain.justification}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {data.recommendedDomain.potentialRoles.map(role => (
              <span key={role} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold border border-white/20">{role}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0 relative z-10">
          <button 
            onClick={onStartInterview}
            className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all shadow-2xl hover:-translate-y-2 active:scale-95"
          >
            Launch Career Lab
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col">
          <h4 className="font-black text-emerald-600 flex items-center gap-3 mb-6 text-lg uppercase tracking-wider">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            Top Strengths
          </h4>
          <ul className="space-y-4 flex-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-slate-600 text-sm font-medium leading-relaxed pl-6 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-emerald-400 before:rounded-full">{s}</li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col">
          <h4 className="font-black text-rose-600 flex items-center gap-3 mb-6 text-lg uppercase tracking-wider">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            Weak Areas
          </h4>
          <ul className="space-y-4 flex-1">
            {data.weaknesses.map((w, i) => (
              <li key={i} className="text-slate-600 text-sm font-medium leading-relaxed pl-6 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-rose-400 before:rounded-full">{w}</li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col">
          <h4 className="font-black text-amber-600 flex items-center gap-3 mb-6 text-lg uppercase tracking-wider">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            Roadmap for Improvement
          </h4>
          <ul className="space-y-4 flex-1">
            {data.improvements.map((imp, i) => (
              <li key={i} className="text-slate-600 text-sm font-medium leading-relaxed pl-6 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-amber-400 before:rounded-full">{imp}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
