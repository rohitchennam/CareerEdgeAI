
import React, { useState } from 'react';
import { ResumeAnalysis, InterviewConfig, InterviewMode, SavedResume, UserProfile } from '../types';
import { FileText, Settings, Zap, GraduationCap, Briefcase, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  analysis: ResumeAnalysis;
  savedResumes: SavedResume[];
  profile: UserProfile;
  currentResumeName: string;
  onLaunch: (config: InterviewConfig) => void;
  onCancel: () => void;
  onUpdateAnalysis: (analysis: ResumeAnalysis, fileName?: string) => void;
  onAnalysisStart: () => void;
}

const InterviewConfigPage: React.FC<Props> = ({ 
  analysis, 
  savedResumes, 
  profile,
  currentResumeName,
  onLaunch, 
  onCancel,
  onUpdateAnalysis,
  onAnalysisStart
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>(analysis.recommendedDomain.title);
  const [selectedMode, setSelectedMode] = useState<InterviewMode>('Off-Campus');
  const [selectedDifficulty, setSelectedDifficulty] = useState<InterviewConfig['difficulty']>('Mid-Level');
  const [questionCount, setQuestionCount] = useState(5);
  const [showResumePicker, setShowResumePicker] = useState(false);

  const handleLaunch = () => {
    onLaunch({
      domain: selectedDomain,
      difficulty: selectedDifficulty,
      questionCount: questionCount,
      mode: selectedMode
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(241, 245, 249, 1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="p-2 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customize Your Session</h1>
          <p className="text-slate-500 font-medium">Fine-tune the AI to match your target role and experience level.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Context & Resume */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Active Context
              </h3>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowResumePicker(!showResumePicker)}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                {showResumePicker ? 'Close' : 'Change'}
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {!showResumePicker ? (
                <motion.div 
                  key="context-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Resume</p>
                    <p className="font-bold text-slate-900 truncate">{currentResumeName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded-full uppercase">
                        ATS: {analysis.atsScore}%
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {analysis.recommendedDomain.title}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Key Skills Detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.skillsFound && analysis.skillsFound.length > 0 ? (
                        <>
                          {analysis.skillsFound.slice(0, 6).map((skill, idx) => (
                            <motion.span 
                              key={skill} 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg"
                            >
                              {skill}
                            </motion.span>
                          ))}
                          {analysis.skillsFound.length > 6 && (
                            <span className="px-2.5 py-1 text-slate-400 text-[10px] font-bold">
                              +{analysis.skillsFound.length - 6} more
                            </span>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium px-1 italic">No specific skills extracted</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="picker-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {savedResumes.map(resume => (
                      <motion.button
                        key={resume.id}
                        whileHover={{ x: 5, backgroundColor: 'rgba(238, 242, 255, 1)' }}
                        onClick={() => {
                          onUpdateAnalysis(resume.analysis, resume.fileName);
                          setSelectedDomain(resume.analysis.recommendedDomain.title);
                          setShowResumePicker(false);
                        }}
                        className="w-full text-left p-3 rounded-xl border border-slate-100 transition-all group"
                      >
                        <p className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600">{resume.fileName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                          {resume.createdAt?.toDate().toLocaleDateString()} • ATS: {resume.analysis.atsScore}%
                        </p>
                      </motion.button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Or Upload New</p>
                    <ResumeUpload 
                      profile={profile}
                      compact={true}
                      onAnalysisStart={onAnalysisStart}
                      onAnalysisComplete={(data, fileName) => {
                        if (data) {
                          onUpdateAnalysis(data, fileName);
                          setSelectedDomain(data.recommendedDomain.title);
                          setShowResumePicker(false);
                        }
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-lg shadow-indigo-200"
          >
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Pro Tip
            </h3>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              The "On-Campus" mode is more rigorous and covers fundamental Computer Science concepts along with your core domain.
            </p>
          </motion.div>
        </motion.div>

        {/* Right Column: Configuration Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                {/* Domain Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Interview Domain</label>
                  <div className="relative">
                    <select 
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none outline-none cursor-pointer"
                    >
                      <option value={analysis.recommendedDomain.title}>{analysis.recommendedDomain.title} (Recommended)</option>
                      {analysis.recommendedDomain.alternativeDomains.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                      <option value="General Software Engineering">General Software Engineering</option>
                      <option value="Frontend Development">Frontend Development</option>
                      <option value="Backend Development">Backend Development</option>
                      <option value="Full Stack Development">Full Stack Development</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Experience Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Junior', 'Mid-Level', 'Senior', 'Expert'] as const).map(level => (
                      <motion.button 
                        key={level}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDifficulty(level)}
                        className={`px-4 py-3.5 rounded-2xl border-2 text-sm font-black transition-all ${
                          selectedDifficulty === level 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                            : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Questions</label>
                    <motion.span 
                      key={questionCount}
                      initial={{ scale: 1.2, backgroundColor: '#4338ca' }}
                      animate={{ scale: 1, backgroundColor: '#4f46e5' }}
                      className="px-3 py-1 text-white text-xs font-black rounded-full"
                    >
                      {questionCount}
                    </motion.span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="15" 
                    step="1"
                    value={questionCount}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-3 font-black uppercase tracking-widest">
                    <span>Quick (5)</span>
                    <span>Standard (10)</span>
                    <span>Deep (15)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Mode Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Interview Focus</label>
                  <div className="space-y-4">
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedMode('Off-Campus')}
                      className={`w-full p-5 rounded-3xl border-2 text-left transition-all group ${
                        selectedMode === 'Off-Campus' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-5 h-5 rounded-full border-4 flex-shrink-0 transition-all ${selectedMode === 'Off-Campus' ? 'border-indigo-600 bg-white' : 'border-slate-300 bg-white'}`} />
                        <div>
                          <p className={`font-black text-base ${selectedMode === 'Off-Campus' ? 'text-indigo-900' : 'text-slate-700'}`}>Off-Campus Mode</p>
                          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Purely role-specific. Focuses on your domain, skills, and projects.</p>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedMode('On-Campus')}
                      className={`w-full p-5 rounded-3xl border-2 text-left transition-all group ${
                        selectedMode === 'On-Campus' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-5 h-5 rounded-full border-4 flex-shrink-0 transition-all ${selectedMode === 'On-Campus' ? 'border-indigo-600 bg-white' : 'border-slate-300 bg-white'}`} />
                        <div>
                          <p className={`font-black text-base ${selectedMode === 'On-Campus' ? 'text-indigo-900' : 'text-slate-700'}`}>On-Campus Mode</p>
                          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Comprehensive. Includes DSA, OS, DBMS + Domain + Projects.</p>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>

                <div className="pt-6">
                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: '#4338ca' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLaunch}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xl transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3"
                  >
                    Launch Interview
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                    AI will generate custom questions based on your profile and job description
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InterviewConfigPage;
