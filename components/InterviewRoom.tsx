
import React, { useEffect, useRef, useState } from 'react';
import { InterviewConfig, InterviewResult, InterviewQuestion } from '../types';
import { generateInterviewQuestions, evaluateFullInterview } from '../services/geminiService';

interface Props {
  config: InterviewConfig;
  onFinish: (result: InterviewResult) => void;
}

const InterviewRoom: React.FC<Props> = ({ config, onFinish }) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'question' | 'recording' | 'reviewing' | 'submitting'>('loading');
  const [answers, setAnswers] = useState<{ question: string, audioData: string }[]>([]);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<'neutral' | 'analyzing' | 'detected'>('neutral');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        const qs = await generateInterviewQuestions(config.domain, config.difficulty, config.questionCount, config.mode);
        if (mounted) {
          setQuestions(qs);
          setStatus('question');
        }
      } catch (err) {
        console.error(err);
        alert("Camera and Microphone access are required for the interview.");
      }
    };
    init();
    
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [config]);

  const captureSnapshot = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      // Monitor feedback effect
      setMonitoringStatus('analyzing');
      setTimeout(() => setMonitoringStatus('detected'), 500);
      setTimeout(() => setMonitoringStatus('neutral'), 1500);

      ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
      const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
      setSnapshots(prev => [...prev, base64]);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      alert("Media stream not available.");
      return;
    }

    chunksRef.current = [];
    setRecordedAudioUrl(null);
    setCurrentAudioBase64(null);
    
    try {
      const recorder = new MediaRecorder(streamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(blob);
        setCurrentAudioBase64(base64);
        setRecordedAudioUrl(URL.createObjectURL(blob));
        setStatus('reviewing');
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus('recording');

      // Intensive facial monitoring interval
      const interval = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          captureSnapshot();
        } else {
          clearInterval(interval);
        }
      }, 2500);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const submitAnswer = async () => {
    if (!currentAudioBase64) return;

    setStatus('submitting');
    
    const newAnswers = [
      ...answers, 
      { 
        question: questions[currentIndex].text, 
        audioData: currentAudioBase64
      }
    ];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setRecordedAudioUrl(null);
      setCurrentAudioBase64(null);
      setStatus('question');
    } else {
      try {
        const result = await evaluateFullInterview(config.domain, newAnswers, snapshots);
        onFinish(result);
      } catch (err) {
        console.error("Evaluation failed:", err);
        alert("Evaluation failed. Please try again.");
        setStatus('reviewing');
      }
    }
  };

  const reAttempt = () => {
    setRecordedAudioUrl(null);
    setCurrentAudioBase64(null);
    setStatus('question');
  };

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-50">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl font-medium tracking-tight">Initializing Career Lab & Facial Tracker...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'behavioral': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'core-cs': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-white overflow-hidden">
      <div className="h-1 bg-slate-800 w-full">
        <div 
          className="h-full bg-indigo-500 transition-all duration-500" 
          style={{ width: `${((currentIndex + 1) / (questions.length || 1)) * 100}%` }} 
        />
      </div>

      <header className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-indigo-400">{config.domain}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider">{config.mode} Session</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${monitoringStatus === 'analyzing' ? 'bg-amber-500 animate-ping' : monitoringStatus === 'detected' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Facial Monitoring: {monitoringStatus.toUpperCase()}</span>
          </div>
          <span className="px-3 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
            {config.difficulty}
          </span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-5 h-[calc(100vh-84px)]">
        <div className="lg:col-span-3 p-8 flex flex-col bg-slate-900/20 relative">
          <div className="relative flex-1 rounded-[40px] overflow-hidden bg-black border border-white/10 shadow-2xl group transition-all duration-700">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" width="320" height="240" />
            
            {/* Visual Monitoring Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-indigo-500/10 transition-colors duration-300" 
                 style={{ borderColor: monitoringStatus === 'analyzing' ? 'rgba(245, 158, 11, 0.2)' : monitoringStatus === 'detected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(79, 70, 229, 0.1)' }} />
            
            {/* Corner Markers */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white/20" />
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white/20" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white/20" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white/20" />

            <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
              <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                <div className={`w-4 h-4 rounded-full ${status === 'recording' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-white block">
                    {status === 'recording' ? 'Live Capture' : 'Sensor Ready'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Evaluation based on response & expression</span>
                </div>
              </div>
            </div>

            {status === 'recording' && (
              <div className="absolute top-10 right-10 flex flex-col items-end gap-2">
                 <div className="flex items-center gap-2 bg-rose-600 px-3 py-1 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-[10px] font-black uppercase text-white">Recording</span>
                 </div>
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Speak Clearly</span>
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-center gap-6">
            {status === 'question' && (
              <button 
                onClick={startRecording}
                className="group flex items-center gap-4 px-12 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-2xl transition-all shadow-2xl hover:-translate-y-2 active:scale-95 border-b-8 border-indigo-800"
              >
                <div className="w-6 h-6 bg-white rounded-full group-hover:scale-125 transition-transform shadow-inner" />
                START MY ANSWER
              </button>
            )}

            {status === 'recording' && (
              <button 
                onClick={stopRecording}
                className="flex items-center gap-4 px-12 py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-[24px] font-black text-2xl transition-all shadow-2xl active:scale-95 border-b-8 border-rose-800"
              >
                <div className="w-6 h-6 bg-white rounded-lg animate-pulse" />
                STOP RECORDING
              </button>
            )}

            {status === 'reviewing' && (
              <div className="flex gap-6">
                <button 
                  onClick={reAttempt}
                  className="px-10 py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-[24px] font-black text-2xl transition-all border border-white/10 active:scale-95 border-b-8 border-slate-900"
                >
                  RE-ATTEMPT
                </button>
                <button 
                  onClick={submitAnswer}
                  className="px-12 py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black text-2xl transition-all shadow-2xl hover:-translate-y-2 active:scale-95 border-b-8 border-emerald-800"
                >
                  SUBMIT ANSWER
                </button>
              </div>
            )}

            {status === 'submitting' && (
              <button disabled className="px-12 py-6 bg-slate-800 text-slate-500 rounded-[24px] font-black text-2xl cursor-not-allowed flex items-center gap-4 border-b-8 border-slate-900">
                <div className="w-6 h-6 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
                {currentIndex < questions.length - 1 ? 'PROCESSING...' : 'EVALUATING...'}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 p-12 bg-slate-900 border-l border-white/5 flex flex-col justify-center relative">
          {currentQ && (
            <div className="space-y-10 animate-fade-in">
              <div className="space-y-6">
                <span className={`inline-block border px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${getTypeBadgeClass(currentQ.type)}`}>
                  {currentQ.type.replace('-', ' ')}
                </span>
                <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                  {currentQ.text}
                </h1>
              </div>

              <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 shadow-inner">
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  {currentQ.type === 'core-cs' 
                    ? "Focus on technical accuracy. We are monitoring your articulation and structural logic." 
                    : "The STAR method is recommended. Maintain eye contact with the camera for high confidence marks."}
                </p>
              </div>

              {recordedAudioUrl && status === 'reviewing' && (
                <div className="p-8 bg-indigo-500/10 rounded-[32px] border border-indigo-500/20 animate-slide-up">
                  <p className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-4">Playback Review</p>
                  <audio src={recordedAudioUrl} controls className="w-full h-12" />
                  <p className="text-[10px] text-slate-500 mt-4 uppercase font-black tracking-tighter">Your facial expressions during this recording have been logged.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InterviewRoom;
