
import React, { useState } from 'react';
import { analyzeResume } from '../services/geminiService';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, SavedResume } from '../types';
import { FileText, Upload, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  profile: UserProfile;
  onAnalysisStart: () => void;
  onAnalysisComplete: (data: any, fileName?: string) => void;
  compact?: boolean;
  savedResumes?: SavedResume[];
  selectedSavedResume?: SavedResume | null;
  onSelectSavedResume?: (resume: SavedResume) => void;
  onContinueWithSaved?: () => void;
}

const ResumeUpload: React.FC<Props> = ({ 
  profile, 
  onAnalysisStart, 
  onAnalysisComplete, 
  compact,
  savedResumes = [],
  selectedSavedResume,
  onSelectSavedResume,
  onContinueWithSaved
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or an Image (JPG/PNG).");
      return;
    }
    setSelectedFile(file);
    // Clear saved resume selection if a new file is picked
    if (selectedSavedResume && onSelectSavedResume) {
      // We don't have a clear function, but we can pass null if we change the type
      // For now, let's assume App.tsx handles it or we'll add it.
    }
  };

  const handleContinue = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    onAnalysisStart();
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const resultRaw = e.target?.result as string;
        if (!resultRaw) throw new Error("Failed to read file");
        
        const base64Data = resultRaw.split(',')[1];
        const result = await analyzeResume(base64Data, selectedFile.type, profile, jobDescription);
        
        if (auth.currentUser) {
          try {
            await addDoc(collection(db, 'resumes'), {
              uid: auth.currentUser.uid,
              fileName: selectedFile.name,
              analysis: result,
              createdAt: serverTimestamp(),
              id: crypto.randomUUID()
            });
          } catch (fsErr) {
            console.error("Failed to save resume to Firestore:", fsErr);
          }
        }

        onAnalysisComplete(result, selectedFile.name);
      } catch (err) {
        console.error("Analysis failed:", err);
        alert("Failed to analyze resume. Please ensure your API key is valid.");
        onAnalysisComplete(null);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
      onAnalysisComplete(null);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(selectedFile);
  };

  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
        className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
        }`}
        onClick={() => document.getElementById('resume-input-compact')?.click()}
      >
        <input
          type="file"
          id="resume-input-compact"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        <div className="flex items-center justify-center gap-3">
          <motion.div 
            animate={selectedFile ? { scale: [1, 1.2, 1] } : {}}
            className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100"
          >
            {selectedFile ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </motion.div>
          <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{selectedFile ? selectedFile.name : 'Upload New Resume'}</p>
        </div>
        {selectedFile && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); handleContinue(); }}
            disabled={isAnalyzing}
            className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Continue'}
          </motion.button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto mt-12 p-10 bg-white rounded-[40px] shadow-2xl border border-slate-100"
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI Resume Profiler</h2>
        <p className="text-slate-500 mt-2 text-lg">Upload your resume and optionally add a Job Description for a match report.</p>
      </div>

      <div className="space-y-10">
        <div>
          <label className="block text-xs font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">Job Description (Optional)</label>
          <textarea
            placeholder="Paste the Job Description here to see how well you match..."
            className="w-full h-32 p-6 bg-slate-50 border border-slate-200 rounded-3xl text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Saved Resumes Column */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 flex flex-col h-[280px]">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Saved Resumes
            </h3>
            {savedResumes.length === 0 ? (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Resumes Yet</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {savedResumes.map(resume => (
                  <motion.button
                    key={resume.id}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (onSelectSavedResume) onSelectSavedResume(resume);
                      setSelectedFile(null); // Clear file selection if saved resume is picked
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                      selectedSavedResume?.id === resume.id 
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/10' 
                        : 'border-slate-50 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600">{resume.fileName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        {resume.createdAt?.toDate().toLocaleDateString()}
                      </p>
                      <span className="text-[9px] font-black text-indigo-600">ATS: {resume.analysis.atsScore}%</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Drop Zone Column */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
            className={`relative border-2 border-dashed rounded-[32px] p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center h-[280px] ${
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
            }`}
            onClick={() => {
              document.getElementById('resume-input')?.click();
            }}
          >
            <input
              type="file"
              id="resume-input"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <div className="space-y-4">
              <motion.div 
                animate={selectedFile ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-all ${
                selectedFile ? 'bg-green-500 shadow-green-100' : 'bg-indigo-600 shadow-indigo-100'
              } shadow-lg`}>
                {selectedFile ? (
                  <CheckCircle2 className="w-7 h-7 text-white" />
                ) : (
                  <Upload className="w-7 h-7 text-white" />
                )}
              </motion.div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Drop your resume PDF/JPG'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {(selectedFile || selectedSavedResume) && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              whileHover={{ scale: 1.02, backgroundColor: '#4338ca' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (selectedFile) handleContinue();
                else if (onContinueWithSaved) onContinueWithSaved();
              }}
              disabled={isAnalyzing}
              className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xl transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : `Continue with ${selectedFile?.name || selectedSavedResume?.fileName}`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ResumeUpload;
