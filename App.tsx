
import React, { useState, useEffect, Component } from 'react';
import Header from './components/Header';
import ResumeUpload from './components/ResumeUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import InterviewRoom from './components/InterviewRoom';
import InterviewConfigPage from './components/InterviewConfig';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import { auth, onAuthStateChanged, User, db } from './firebase';
import { doc, getDoc, query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { FileText, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResumeAnalysis, InterviewConfig, InterviewResult, InterviewMode, SavedResume, SavedInterview, UserProfile } from './types';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<any, any> {
  public state: any = { hasError: false, error: null };

  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(error: any): any {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      if (this.state.error && this.state.error.message) {
        try {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) displayMessage = `Firestore Error: ${parsed.error}`;
        } catch (e) {
          displayMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Application Error</h2>
            <p className="text-slate-600 mb-8">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<'home' | 'resumes' | 'interviews' | 'profile'>('home');
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedSavedResume, setSelectedSavedResume] = useState<SavedResume | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const [currentResumeName, setCurrentResumeName] = useState<string>('');
  const [showHero, setShowHero] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = () => {};
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Reset UI state on any auth change (login/logout)
      setAnalysis(null);
      setIsAnalyzing(false);
      setInterviewConfig(null);
      setInterviewResult(null);
      setShowConfig(false);
      setView('home');
      setShowHero(true);

      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
          setIsAuthReady(true);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setIsAuthReady(true);
        });
      } else {
        setProfile(null);
        setIsAuthReady(true);
      }
    });
    
    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  // Fetch saved resumes for the selection list
  useEffect(() => {
    if (!user) {
      setSavedResumes([]);
      return;
    }
    const q = query(
      collection(db, 'resumes'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setSavedResumes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavedResume)));
    }, (error) => {
      console.error("Resumes snapshot error:", error);
    });
    return () => unsub();
  }, [user]);

  const handleStartInterview = () => {
    setShowConfig(true);
  };

  const handleLaunchInterview = (config: InterviewConfig) => {
    setInterviewConfig(config);
    setShowConfig(false);
  };

  const handleAnalysisComplete = (data: ResumeAnalysis | null, fileName?: string) => {
    setIsAnalyzing(false);
    if (data) {
      setAnalysis(data);
      setSelectedSavedResume(null);
      if (fileName) setCurrentResumeName(fileName);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setIsAnalyzing(false);
    setInterviewConfig(null);
    setInterviewResult(null);
    setShowConfig(false);
    setView('home');
    setShowHero(true);
  };

  const handleSelectResume = (resume: SavedResume) => {
    setSelectedSavedResume(resume);
    setView('home');
  };

  const handleContinueWithSaved = () => {
    if (selectedSavedResume) {
      setAnalysis(selectedSavedResume.analysis);
      setCurrentResumeName(selectedSavedResume.fileName);
      setSelectedSavedResume(null);
    }
  };

  const handleSelectInterview = (interview: SavedInterview) => {
    setInterviewResult(interview.result);
    setView('home');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        onReset={handleReset} 
        onShowResumes={() => setView('resumes')}
        onShowInterviews={() => setView('interviews')}
        onShowProfile={() => setView('profile')}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {!isAuthReady ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !user ? (
          <Login />
        ) : !profile || view === 'profile' ? (
          <Onboarding 
            initialProfile={profile}
            onComplete={(p) => { setProfile(p); setView('home'); }} 
            onCancel={profile ? () => setView('home') : undefined}
          />
        ) : view === 'resumes' ? (
          <Dashboard 
            type="resumes" 
            onSelectResume={handleSelectResume} 
            onSelectInterview={handleSelectInterview} 
            onAddResume={() => { setView('home'); setShowHero(false); setAnalysis(null); }}
          />
        ) : view === 'interviews' ? (
          <Dashboard type="interviews" onSelectResume={handleSelectResume} onSelectInterview={handleSelectInterview} />
        ) : (
          <>
            {!analysis && !isAnalyzing && (
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                    Bridge the Gap to Your <span className="text-indigo-600">Dream Career</span>
                  </h1>
                  <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-12 font-medium">
                    Analyze your resume, discover your perfect career domain, and practice with real-time AI mock interviews.
                  </p>
                </motion.div>

                <AnimatePresence mode="wait">
                  {showHero ? (
                    <motion.div
                      key="hero-button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      className="flex justify-center"
                    >
                      <motion.button
                        whileHover="hover"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowHero(false)}
                        className="flex items-center gap-3 px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 group"
                      >
                        Get Started
                        <motion.div
                          variants={{
                            hover: { x: 10 }
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                          <ArrowRight className="w-8 h-8" />
                        </motion.div>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="resume-upload"
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        type: 'spring',
                        damping: 25,
                        stiffness: 120,
                        delay: 0.1
                      }}
                      className="max-w-4xl mx-auto"
                    >
                      <ResumeUpload 
                        profile={profile}
                        onAnalysisStart={() => setIsAnalyzing(true)} 
                        onAnalysisComplete={(data, fileName) => handleAnalysisComplete(data, fileName)} 
                        savedResumes={savedResumes}
                        selectedSavedResume={selectedSavedResume}
                        onSelectSavedResume={handleSelectResume}
                        onContinueWithSaved={handleContinueWithSaved}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 space-y-6"
          >
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent" 
              />
            </div>
            <p className="text-lg font-medium text-slate-600">Processing...</p>
          </motion.div>
        )}

        {analysis && !interviewConfig && !interviewResult && !showConfig && (
          <div className="animate-fade-in">
             <AnalysisDashboard data={analysis} onStartInterview={handleStartInterview} />
          </div>
        )}

        {showConfig && analysis && (
          <InterviewConfigPage 
            analysis={analysis}
            savedResumes={savedResumes}
            profile={profile!}
            currentResumeName={currentResumeName || profile?.resumeName || 'Analyzed Context'}
            onLaunch={handleLaunchInterview}
            onCancel={() => setShowConfig(false)}
            onUpdateAnalysis={(newAnalysis, fileName) => {
              setAnalysis(newAnalysis);
              if (fileName) setCurrentResumeName(fileName);
            }}
            onAnalysisStart={() => setIsAnalyzing(true)}
          />
        )}

        {interviewConfig && !interviewResult && (
          <InterviewRoom 
            config={interviewConfig} 
            profile={profile}
            onFinish={(result) => { setInterviewResult(result); setInterviewConfig(null); }} 
          />
        )}

            {interviewResult && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 text-center">
                  <h2 className="text-4xl font-extrabold text-slate-900">Interview Evaluation</h2>
                  <div className="flex justify-center mt-10">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100" />
                        <motion.circle 
                          initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - (interviewResult.accuracy || 0) / 100) }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 80}
                          className="text-indigo-600" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-5xl font-black text-slate-900"
                        >
                          {interviewResult.accuracy || 0}%
                        </motion.span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Accuracy</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-slate-50 p-8 rounded-2xl"
                    >
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Knowledge Grasp
                      </h3>
                      <p className="text-slate-600 leading-relaxed">{interviewResult.knowledgeGrasp}</p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-slate-50 p-8 rounded-2xl"
                    >
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Expression Analysis
                      </h3>
                      <p className="text-slate-600 leading-relaxed">{interviewResult.expressionAnalysis}</p>
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 p-8 bg-indigo-50 rounded-2xl text-left border border-indigo-100"
                  >
                     <h3 className="font-bold text-indigo-900 mb-2">Coach's Feedback</h3>
                     <p className="text-indigo-800 italic leading-relaxed">"{interviewResult.feedback}"</p>
                  </motion.div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInterviewResult(null)}
                    className="mt-12 px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold transition-all shadow-xl"
                  >
                    Return to Dashboard
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">CareerEdge AI &copy; 2025</p>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
};

export default App;
