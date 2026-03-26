import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 text-center max-w-md w-full"
      >
        <motion.div 
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"
        >
          <LogIn className="w-10 h-10 text-indigo-600" />
        </motion.div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-600 mb-10 font-medium">
          {isSignUp 
            ? 'Join CareerEdge AI to personalize your career growth and track your progress.' 
            : 'Sign in to access your resume analysis, interview history, and dashboard.'}
        </p>
        
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: '#4338ca' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-3 mb-8"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-1" />
          {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
        </motion.button>

        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
          <div className="h-[1px] bg-slate-100 flex-1" />
          <span>OR</span>
          <div className="h-[1px] bg-slate-100 flex-1" />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-8 text-indigo-600 font-black hover:text-indigo-700 transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Login;
