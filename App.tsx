
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ResumeUpload from './components/ResumeUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import InterviewRoom from './components/InterviewRoom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import { auth, onAuthStateChanged, User, db } from './firebase';
import { doc, getDoc, query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { FileText } from 'lucide-react';
import { ResumeAnalysis, InterviewConfig, InterviewResult, InterviewMode, SavedResume, SavedInterview, UserProfile } from './types';

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

  useEffect(() => {
    let unsubscribeProfile = () => {};
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
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
    });
    return () => unsub();
  }, [user]);

  // Local state for config form
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<InterviewMode>('Off-Campus');
  const [selectedDifficulty, setSelectedDifficulty] = useState<InterviewConfig['difficulty']>('Mid-Level');
  const [questionCount, setQuestionCount] = useState(5);

  useEffect(() => {
    if (analysis) {
      setSelectedDomain(analysis.recommendedDomain.title);
    }
  }, [analysis]);

  const handleStartInterview = () => {
    setShowConfig(true);
  };

  const handleLaunchInterview = () => {
    const config: InterviewConfig = {
      domain: selectedDomain || (analysis?.recommendedDomain.title || 'General'),
      difficulty: selectedDifficulty,
      questionCount: questionCount,
      mode: selectedMode
    };
    setInterviewConfig(config);
    setShowConfig(false);
  };

  const handleAnalysisComplete = (data: ResumeAnalysis | null) => {
    setIsAnalyzing(false);
    if (data) {
      setAnalysis(data);
      setSelectedSavedResume(null);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setIsAnalyzing(false);
    setInterviewConfig(null);
    setInterviewResult(null);
    setShowConfig(false);
    setView('home');
  };

  const handleSelectResume = (resume: SavedResume) => {
    setSelectedSavedResume(resume);
    setView('home');
  };

  const handleContinueWithSaved = () => {
    if (selectedSavedResume) {
      setAnalysis(selectedSavedResume.analysis);
      setSelectedSavedResume(null);
    }
  };

  const handleSelectInterview = (interview: SavedInterview) => {
    setInterviewResult(interview.result);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        onReset={handleReset} 
        onShowResumes={() => setView('resumes')}
        onShowInterviews={() => setView('interviews')}
        onShowProfile={() => setView('profile')}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <Dashboard type="resumes" onSelectResume={handleSelectResume} onSelectInterview={handleSelectInterview} />
        ) : view === 'interviews' ? (
          <Dashboard type="interviews" onSelectResume={handleSelectResume} onSelectInterview={handleSelectInterview} />
        ) : (
          <>
            {!analysis && !isAnalyzing && (
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              Bridge the Gap to Your <span className="text-indigo-600">Dream Career</span>
            </h1>
            <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-12">
              Analyze your resume, discover your perfect career domain, and practice with real-time AI mock interviews.
            </p>
            
            <div className="max-w-4xl mx-auto">
              <ResumeUpload 
                profile={profile}
                onAnalysisStart={() => setIsAnalyzing(true)} 
                onAnalysisComplete={handleAnalysisComplete} 
                savedResumes={savedResumes}
                selectedSavedResume={selectedSavedResume}
                onSelectSavedResume={handleSelectResume}
                onContinueWithSaved={handleContinueWithSaved}
              />
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-lg font-medium text-slate-600">Processing...</p>
          </div>
        )}

        {analysis && !interviewConfig && !interviewResult && !showConfig && (
          <div className="animate-fade-in">
             <AnalysisDashboard data={analysis} onStartInterview={handleStartInterview} />
          </div>
        )}

        {showConfig && analysis && (
          <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 animate-slide-up">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Customize Your Mock Interview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Select Domain</label>
                  <select 
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value={analysis.recommendedDomain.title}>Primary: {analysis.recommendedDomain.title}</option>
                    {analysis.recommendedDomain.alternativeDomains.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="General Software Engineering">General Software Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Difficulty Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Junior', 'Mid-Level', 'Senior', 'Expert'].map(level => (
                      <button 
                        key={level}
                        onClick={() => setSelectedDifficulty(level as any)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                          selectedDifficulty === level ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Number of Questions: <span className="text-indigo-600">{questionCount}</span></label>
                  <input 
                    type="range" 
                    min="5" 
                    max="15" 
                    step="1"
                    value={questionCount}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                    <span>Min: 5</span>
                    <span>Max: 15</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Interview Mode</label>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setSelectedMode('Off-Campus')}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                        selectedMode === 'Off-Campus' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-4 flex-shrink-0 ${selectedMode === 'Off-Campus' ? 'border-indigo-600 bg-white' : 'border-slate-300'}`} />
                        <div>
                          <p className={`font-bold ${selectedMode === 'Off-Campus' ? 'text-indigo-900' : 'text-slate-700'}`}>Off-Campus Mode</p>
                          <p className="text-xs text-slate-500 mt-1">Focused purely on your selected domain, role & projects.</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setSelectedMode('On-Campus')}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                        selectedMode === 'On-Campus' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-4 flex-shrink-0 ${selectedMode === 'On-Campus' ? 'border-indigo-600 bg-white' : 'border-slate-300'}`} />
                        <div>
                          <p className={`font-bold ${selectedMode === 'On-Campus' ? 'text-indigo-900' : 'text-slate-700'}`}>On-Campus Mode</p>
                          <p className="text-xs text-slate-500 mt-1">Includes core CS (DSA, OS, DBMS, CN) + Domain + Projects.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Update Context</p>
                    <ResumeUpload 
                      profile={profile!}
                      compact={true}
                      onAnalysisStart={() => setIsAnalyzing(true)} 
                      onAnalysisComplete={(data) => {
                        handleAnalysisComplete(data);
                        if (data) setSelectedDomain(data.recommendedDomain.title);
                      }} 
                    />
                  </div>
                  
                  <button 
                    onClick={handleLaunchInterview}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
                  >
                    Launch Live Session
                  </button>
                  <button 
                    onClick={() => setShowConfig(false)}
                    className="w-full py-2 mt-2 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {interviewConfig && !interviewResult && (
          <InterviewRoom 
            config={interviewConfig} 
            profile={profile}
            onFinish={(result) => { setInterviewResult(result); setInterviewConfig(null); }} 
          />
        )}

            {interviewResult && (
              <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 text-center">
                  <h2 className="text-4xl font-extrabold text-slate-900">Interview Evaluation</h2>
                  <div className="flex justify-center mt-10">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100" />
                        <circle 
                          cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 80}
                          strokeDashoffset={2 * Math.PI * 80 * (1 - (interviewResult.accuracy || 0) / 100)}
                          className="text-indigo-600 transition-all duration-1000" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-900">{interviewResult.accuracy || 0}%</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Accuracy</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="bg-slate-50 p-8 rounded-2xl">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Knowledge Grasp
                      </h3>
                      <p className="text-slate-600 leading-relaxed">{interviewResult.knowledgeGrasp}</p>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-2xl">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Expression Analysis
                      </h3>
                      <p className="text-slate-600 leading-relaxed">{interviewResult.expressionAnalysis}</p>
                    </div>
                  </div>

                  <div className="mt-8 p-8 bg-indigo-50 rounded-2xl text-left border border-indigo-100">
                     <h3 className="font-bold text-indigo-900 mb-2">Coach's Feedback</h3>
                     <p className="text-indigo-800 italic leading-relaxed">"{interviewResult.feedback}"</p>
                  </div>

                  <button 
                    onClick={() => setInterviewResult(null)}
                    className="mt-12 px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
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
  );
};

export default App;
