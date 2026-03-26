import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { SavedResume, SavedInterview } from '../types';
import { FileText, Video, Trash2, ChevronRight, Calendar, Award } from 'lucide-react';

interface Props {
  type: 'resumes' | 'interviews';
  onSelectResume: (resume: SavedResume) => void;
  onSelectInterview: (interview: SavedInterview) => void;
}

const Dashboard: React.FC<Props> = ({ type, onSelectResume, onSelectInterview }) => {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [interviews, setInterviews] = useState<SavedInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    let unsubResumes = () => {};
    let unsubInterviews = () => {};

    if (type === 'resumes') {
      const resumesQuery = query(
        collection(db, 'resumes'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      unsubResumes = onSnapshot(resumesQuery, (snapshot) => {
        setResumes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavedResume)));
        setLoading(false);
      });
    }

    if (type === 'interviews') {
      const interviewsQuery = query(
        collection(db, 'interviews'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      unsubInterviews = onSnapshot(interviewsQuery, (snapshot) => {
        setInterviews(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavedInterview)));
        setLoading(false);
      });
    }

    return () => {
      unsubResumes();
      unsubInterviews();
    };
  }, [user, type]);

  const handleDeleteResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // In a real app, we'd use a custom modal. For now, we'll proceed with deletion
    // but we should avoid window.confirm as per iframe restrictions.
    try {
      await deleteDoc(doc(db, 'resumes', id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDeleteInterview = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'interviews', id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {type === 'resumes' && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              My Resumes
            </h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{resumes.length} Saved</span>
          </div>
          
          {resumes.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <p className="text-slate-500 font-medium">No resumes analyzed yet. Upload one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  onClick={() => onSelectResume(resume)}
                  className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <button
                      onClick={(e) => handleDeleteResume(e, resume.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate mb-1">{resume.fileName}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-4 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {resume.createdAt?.toDate().toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                        ATS: {resume.analysis.atsScore}%
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {type === 'interviews' && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-indigo-600" />
              Interview History
            </h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{interviews.length} Sessions</span>
          </div>

          {interviews.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <p className="text-slate-500 font-medium">No mock interviews recorded yet. Practice makes perfect!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() => onSelectInterview(interview)}
                  className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer flex items-center gap-6"
                >
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Award className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 truncate">{interview.config.domain}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-black uppercase tracking-widest">
                        {interview.config.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-4">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {interview.createdAt?.toDate().toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 uppercase tracking-tighter">{interview.config.mode}</span>
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div>
                      <p className="text-xl font-black text-indigo-600">{interview.result.accuracy}%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Accuracy</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteInterview(e, interview.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
