import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <LogIn className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-600 mb-10 font-medium">
          {isSignUp 
            ? 'Join CareerEdge AI to personalize your career growth and track your progress.' 
            : 'Sign in to access your resume analysis, interview history, and dashboard.'}
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 mb-8"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-1" />
          {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
        </button>

        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
          <div className="h-[1px] bg-slate-100 flex-1" />
          <span>OR</span>
          <div className="h-[1px] bg-slate-100 flex-1" />
        </div>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-8 text-indigo-600 font-black hover:text-indigo-700 transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default Login;
