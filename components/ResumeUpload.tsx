
import React, { useState } from 'react';
import { analyzeResume } from '../services/geminiService';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  onAnalysisStart: () => void;
  onAnalysisComplete: (data: any) => void;
  compact?: boolean;
}

const ResumeUpload: React.FC<Props> = ({ profile, onAnalysisStart, onAnalysisComplete, compact }) => {
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

        onAnalysisComplete(result);
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
      <div 
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
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-700">{selectedFile ? selectedFile.name : 'Upload New Resume'}</p>
        </div>
        {selectedFile && (
          <button
            onClick={(e) => { e.stopPropagation(); handleContinue(); }}
            disabled={isAnalyzing}
            className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Continue'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI Resume Profiler</h2>
        <p className="text-slate-500 mt-2 text-lg">Upload your resume and optionally add a Job Description for a match report.</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Job Description (Optional)</label>
          <textarea
            placeholder="Paste the Job Description here to see how well you match..."
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
          className={`relative border-4 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
          }`}
          onClick={() => document.getElementById('resume-input')?.click()}
        >
          <input
            type="file"
            id="resume-input"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <div className="space-y-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Drop your resume PDF/JPG'}
              </p>
            </div>
          </div>
        </div>

        {selectedFile && (
          <button
            onClick={handleContinue}
            disabled={isAnalyzing}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;
