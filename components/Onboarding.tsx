import React, { useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, ResumeAnalysis } from '../types';
import { User, Briefcase, Target, Award, ArrowRight, FileText, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { analyzeResume } from '../services/geminiService';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Props {
  initialProfile?: UserProfile | null;
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}

const Onboarding: React.FC<Props> = ({ initialProfile, onComplete, onCancel }) => {
  const [currentRole, setCurrentRole] = useState(initialProfile?.currentRole || '');
  const [targetRole, setTargetRole] = useState(initialProfile?.targetRole || '');
  const [experienceYears, setExperienceYears] = useState(initialProfile?.experienceYears || 0);
  const [skills, setSkills] = useState(initialProfile?.skills?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(initialProfile?.resumeAnalysis || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    // No analysis here as per user request
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const profileData: any = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || '',
        photoURL: auth.currentUser.photoURL || '',
        experienceYears,
        skills: skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        currentRole: currentRole || '',
        targetRole: targetRole || '',
      };

      if (!initialProfile) {
        profileData.createdAt = serverTimestamp();
      } else {
        // Ensure createdAt is present for security rules even on merge
        profileData.createdAt = initialProfile.createdAt;
      }

      if (resumeFile) {
        profileData.resumeName = resumeFile.name;
        
        // If we have a resume, we should also save it to the resumes collection
        // But we need an analysis first. Since we don't analyze here, 
        // we'll just save the profile and let the user analyze it later from the dashboard.
        // OR we can do a quick analysis now. Let's do a quick analysis if a file is uploaded.
        try {
          setIsAnalyzing(true);
          
          // Convert file to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
          });
          reader.readAsDataURL(resumeFile);
          const base64Data = await base64Promise;

          const analysisResult = await analyzeResume(base64Data, resumeFile.type, profileData as UserProfile);
          const resumeId = crypto.randomUUID();
          const resumeData = {
            id: resumeId,
            uid: auth.currentUser.uid,
            fileName: resumeFile.name,
            analysis: analysisResult,
            createdAt: serverTimestamp(),
          };
          
          try {
            await setDoc(doc(db, 'resumes', resumeId), resumeData);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `resumes/${resumeId}`);
          }
        } catch (error) {
          console.error('Resume analysis failed:', error);
          // Continue anyway, just without the resume analysis
        } finally {
          setIsAnalyzing(false);
        }
      }

      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), profileData, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
      }
      
      // For local state, we use a Date instead of serverTimestamp sentinel
      const localProfile = {
        ...profileData,
        createdAt: initialProfile?.createdAt || new Date()
      };
      
      onComplete(localProfile as UserProfile);
    } catch (error) {
      console.error('Onboarding failed:', error);
      alert('Failed to save profile. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {initialProfile ? 'Update Your Profile' : 'Personalize Your Experience'}
          </h2>
          <p className="text-slate-500 mt-2 text-lg">
            {initialProfile 
              ? 'Keep your career goals up to date for the best AI recommendations.' 
              : 'Tell us about your career goals so we can fine-tune our AI for you.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Current Role (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Student, Junior Developer"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Target Role (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Years of Experience: <span className="text-indigo-600">{experienceYears}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  <span>Fresher</span>
                  <span>30+ Years</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                  Key Skills (Optional, Comma separated)
                </label>
                <textarea
                  placeholder="React, TypeScript, Node.js, AWS..."
                  className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                <FileText className="w-4 h-4 text-indigo-600" />
                Upload Resume (Optional)
              </label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[32px] p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[280px] ${
                  resumeFile ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                />
                
                {resumeFile ? (
                  <div className="space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-indigo-600 mx-auto" />
                    <div>
                      <p className="text-indigo-900 font-black text-lg">Resume Selected!</p>
                      <p className="text-indigo-600 text-sm mt-1">{resumeFile.name}</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl border border-indigo-100 text-left">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-indigo-800 text-sm font-bold">Ready to save with profile</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-black text-lg">Drop your resume here</p>
                      <p className="text-slate-500 text-sm mt-1">We'll store it with your profile for future use.</p>
                    </div>
                    <button type="button" className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">
                      Browse Files
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">Supports PDF, DOCX (Max 5MB)</p>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <button
              type="submit"
              disabled={loading || isAnalyzing}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : initialProfile ? 'Update Profile' : 'Complete Setup'}
              {!loading && <ArrowRight className="w-6 h-6" />}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
