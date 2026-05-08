import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, LineChart, FileText, Users, LogOut, Upload, ShieldCheck, Search, Info, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeReport, AnalysisResult } from './services/geminiService';
import { supabase } from './supabaseClient';

// --- Components ---

const Login = ({ onLogin, onSwitch, initialEmail = '', initialMessage = '' }: { 
  onLogin: (token: string, role: string) => void, 
  onSwitch: () => void,
  initialEmail?: string,
  initialMessage?: string
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else if (data.session) {
      const userRole = data.user.user_metadata?.role || 'patient';
      onLogin(data.session.access_token, userRole);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
      <div className="flex items-center justify-center mb-6">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-center text-slate-900 mb-2 font-sans">Welcome Back</h2>
      <p className="text-center text-slate-500 mb-8">Login to your diagnosis assistant</p>
      
      {initialMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <p className="text-emerald-700 text-xs font-bold leading-relaxed">{initialMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400" placeholder="your@email.com" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
        </div>
        {error && <p className="text-rose-500 text-sm mt-2 font-medium">{error}</p>}
        <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm">
          <LogIn className="w-5 h-5" /> Sign In
        </button>
      </form>
      <p className="mt-6 text-center text-slate-600">
        Don't have an account? <button onClick={onSwitch} className="text-indigo-600 font-bold hover:underline">Register now</button>
      </p>
    </motion.div>
  );
};

const Register = ({ onSwitch, onSuccess }: { onSwitch: () => void, onSuccess: (email: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role
        }
      }
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
      // If session exists (auto-login enabled), we could redirect, 
      // but usually for clinical apps email confirmation is turned on.
      if (!data.session) {
        setTimeout(() => onSuccess(email), 2500);
      } else {
        // Auto-logged in, but the prompt asked for redirect to sign in with success message
        // Usually Supabase auto-logins on signup unless specified otherwise or confirm email is on.
        // We still follow the prompt's request for explicit redirect behavior.
        setTimeout(() => onSuccess(email), 2500);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
      <h2 className="text-3xl font-bold text-center text-slate-900 mb-2 font-sans">Create Account</h2>
      <p className="text-center text-slate-500 mb-8">Join the assistant diagnosis system</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="your@email.com" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Password (Min 6 chars)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white">
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <p className="text-rose-500 text-sm mt-2 font-medium">{error}</p>}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-emerald-700 text-sm font-bold">Registration success!</p>
            <p className="text-emerald-600 text-xs">Check your email and confirm your account before logging in.</p>
          </div>
        )}
        <button type="submit" disabled={success} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <UserPlus className="w-5 h-5" /> Register
        </button>
      </form>
      <p className="mt-6 text-center text-slate-600">
        Already have an account? <button onClick={onSwitch} className="text-indigo-600 font-bold hover:underline">Login here</button>
      </p>
    </motion.div>
  );
};

const History = ({ token }: { token: string }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        doctors (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Generate signed URLs for each report that has a file_path
      const reportsWithUrls = await Promise.all(data.map(async (report) => {
        if (report.file_path) {
          const { data: shareData, error: shareError } = await supabase.storage
            .from('app-files')
            .createSignedUrl(report.file_path, 3600, { download: false }); // inline viewing
            
          if (!shareError) {
            return { ...report, signedUrl: shareData.signedUrl };
          }
        }
        return report;
      }));
      setReports(reportsWithUrls);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleDelete = async (reportId: string, filePath: string | null) => {
    if (!confirm('Are you sure you want to delete this clinical record? This action cannot be undone.')) return;

    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
      
      if (dbError) throw dbError;

      // 2. Delete from storage if file exists
      if (filePath) {
        await supabase.storage.from('app-files').remove([filePath]);
      }

      setReports(reports.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading clinical records...</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
            <FileText className="text-indigo-600" /> Medical History
          </h2>
          <p className="text-sm text-slate-500">Access all your verified records and analysis history</p>
        </div>
      </div>
      <div className="grid gap-6">
        {reports.map((report: any) => {
          const analysis = report.analysis_result;
          const doctorName = report.doctors?.name;
          const needsAttention = analysis.vitalMarkers.some((m: any) => m.status !== 'normal');
          
          return (
            <div key={report.id} className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
              <button 
                onClick={() => handleDelete(report.id, report.file_path)}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Delete Record"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex justify-between items-start mb-6 pr-10">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 mb-1">{analysis.condition}</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Record ID: {report.id.slice(0, 8)} • {new Date(report.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${needsAttention ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  {needsAttention ? 'Attention Required' : 'Normal Result'}
                </span>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{analysis.summary}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {analysis.vitalMarkers.map((m: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border flex flex-col gap-1 ${m.status === 'normal' ? 'bg-white border-slate-100' : 'bg-rose-50/50 border-rose-100'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{m.name}</span>
                    <span className={`font-bold text-lg ${m.status === 'normal' ? 'text-slate-900' : 'text-rose-600'}`}>{m.value}</span>
                    <span className={`text-[10px] font-bold uppercase ${m.status === 'normal' ? 'text-emerald-600' : 'text-rose-400'}`}>{m.status}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {doctorName && (
                    <>
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold italic">
                        {doctorName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Recommended Specialist</p>
                        <p className="font-bold text-slate-900">{doctorName}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {report.signedUrl && (
                  <a 
                    href={report.signedUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-all text-sm shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> View Full Report
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {reports.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-400 font-medium">No medical records found in history.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Doctors = ({ token, userRole }: { token: string, userRole: string }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: '', contact: '', location: '', clinic_name: '' });

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('name');
    
    if (!error) setDoctors(data || []);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const { error: insertError } = await supabase
        .from('doctors')
        .insert([newDoctor]);

      if (insertError) {
        setError(insertError.message);
      } else {
        setShowAdd(false);
        setNewDoctor({ name: '', specialty: '', contact: '', location: '', clinic_name: '' });
        fetchDoctors();
      }
    } catch (err) {
      setError('Connection error occurred');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Users className="text-indigo-600" /> Doctors Network
          </h2>
          <p className="text-sm text-slate-500">Manage and view contracted clinical specialists</p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowAdd(!showAdd)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200">
            <UserPlus className="w-4 h-4" /> Add Specialist
          </button>
        )}
      </div>

      {showAdd && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-10 p-8 bg-indigo-50 rounded-2xl border border-indigo-100 overflow-hidden">
          <h3 className="font-bold text-indigo-900 mb-2">Register Contracted Clinical Specialist</h3>
          <p className="text-xs text-indigo-400 mb-6">Enter official credentials to add the specialist to the clinical directory.</p>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
              <Info className="w-4 h-4" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Full Name</label>
              <input placeholder="Dr. John Doe" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-indigo-100 focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Specialty</label>
              <input placeholder="e.g. Diabetologist, Cardiologist" value={newDoctor.specialty} onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-indigo-100 focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Contact Info</label>
              <input placeholder="+1 (555) 000-0000" value={newDoctor.contact} onChange={e => setNewDoctor({...newDoctor, contact: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-indigo-100 focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Address / Location</label>
              <input placeholder="Building A, Medical Center" value={newDoctor.location} onChange={e => setNewDoctor({...newDoctor, location: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-indigo-100 focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Clinic Name</label>
              <input placeholder="Main City Clinic" value={newDoctor.clinic_name} onChange={e => setNewDoctor({...newDoctor, clinic_name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-indigo-100 focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div className="md:col-span-2 flex gap-3 mt-4">
              <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md border border-indigo-700">Confirm Contract</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-8 py-3 bg-white border border-indigo-100 rounded-xl text-indigo-600 font-bold">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {doctors.map((doc: any) => (
          <div key={doc.id} className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-2xl shrink-0 italic">
              {doc.name.split(' ').map((n:string)=>n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-lg text-slate-900 truncate">{doc.name}</h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase border border-emerald-100 rounded">Verified</span>
              </div>
              <p className="text-indigo-600 text-sm font-bold uppercase tracking-tight mb-3">{doc.specialty}</p>
              <div className="space-y-1 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="flex items-center gap-2 font-medium">🏢 {doc.clinic_name}</p>
                <p className="flex items-center gap-2">📍 {doc.location}</p>
                <p className="flex items-center gap-2 font-mono text-indigo-700">📞 {doc.contact}</p>
              </div>
            </div>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="md:col-span-2 text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-400 font-medium">No clinical partners registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UploadReport = ({ token }: { token: string }) => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setRecommendation(null);

    try {
      const reader = new FileReader();
      
      const isImage = file.type.startsWith('image/');
      
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        if (isImage) {
          // Extracts base64 from data URL
          const base64 = result.split(',')[1];
          await processAnalysis("", file.name, { data: base64, mimeType: file.type });
        } else {
          await processAnalysis(result || "", file.name);
        }
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    } catch (err) {
      console.error(err);
      setAnalyzing(false);
    }
  };

  const processAnalysis = async (text: string, fileName: string, fileData?: { data: string; mimeType: string }) => {
    setAnalyzing(true);
    try {
      const analysis = await analyzeReport(text, fileData);
      setResult(analysis);
      
      const { data: doctors } = await supabase
        .from('doctors')
        .select('*')
        .ilike('specialty', `%${analysis.recommendedSpecialty}%`);
        
      setRecommendation(doctors?.[0] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const useDemoData = () => {
    const demoText = `Patient: Sample User
Date: May 07, 2026
Findings:
- Glucose: 165 mg/dL (Target: 70-99)
- Blood Pressure: 142/92 mmHg
- WBC Count: 10,500 cells/mcL
- Hemoglobin: 13.2 g/dL
Summary: Patient exhibits elevated glucose and borderline high blood pressure. Recommendation for metabolic screening.`;
    
    // Create a dummy file object for consistency in the save logic
    const dummyFile = new File([demoText], "demo_report.txt", { type: "text/plain" });
    setFile(dummyFile);
    processAnalysis(demoText, "demo_report.txt");
  };

  const saveReport = async () => {
    if (!result || !file) return;
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-files')
        .upload(filePath, file, { contentType: file.type || 'application/octet-stream' });

      if (uploadError) throw uploadError;

      // 2. Save record to Database
      const { error: insertError } = await supabase
        .from('reports')
        .insert([{
          patient_id: user.id,
          original_name: file.name,
          file_path: filePath,
          analysis_result: result,
          recommended_doctor_id: recommendation?.id || null
        }]);

      if (insertError) {
        // Cleanup if DB fails
        await supabase.storage.from('app-files').remove([filePath]);
        throw insertError;
      }

      alert('Report analyzed and saved to your history!');
      setFile(null);
      setResult(null);
      setRecommendation(null);
    } catch (err: any) {
      alert('Failed to save report: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Upload className="text-indigo-600" /> Upload Medical Report
        </h2>
        <p className="text-sm text-slate-500">Securely upload your clinical documents for AI-driven analysis</p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-white text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-100 transition-colors">
                <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-600" />
              </div>
              <p className="text-slate-900 font-bold mb-1">Drop your report here</p>
              <p className="text-xs text-slate-400 mb-6 font-medium">Supports images or .txt files for analysis</p>
              <input type="file" onChange={handleFileChange} className="hidden" id="report-file" accept="image/*,.txt" />
              <label htmlFor="report-file" className="inline-block px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                Select File
              </label>
              {file && <p className="mt-6 font-bold text-indigo-600 text-sm bg-indigo-50 py-2 rounded-lg border border-indigo-100 italic">"{file.name}" ready</p>}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              {file && !result && (
                <button onClick={handleUpload} disabled={analyzing} className="w-full py-4 bg-indigo-900 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-950 transition-all flex items-center justify-center gap-3">
                  {analyzing ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white" /> : <LineChart className="w-5 h-5" />}
                  {analyzing ? 'System Analyzing...' : 'Begin Diagnostic Analysis'}
                </button>
              )}
              
              {!result && (
                <button onClick={useDemoData} disabled={analyzing} className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                  <Info className="w-4 h-4" /> Try with Demo Report
                </button>
              )}
            </div>
          </div>

        <div className="lg:col-span-7">
          {result ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="bg-indigo-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-bl-full opacity-30"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">Analysis Result</span>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-indigo-200 text-sm font-medium mb-1">Detected Primary Condition</p>
                    <h3 className="text-3xl font-bold">{result.condition}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {result.vitalMarkers.map((m, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <p className="text-[10px] text-indigo-200 uppercase tracking-tighter font-bold">{m.name}</p>
                        <p className={`text-xl font-bold ${m.status === 'normal' ? 'text-white' : 'text-rose-300'}`}>{m.value}</p>
                        <p className={`text-[10px] uppercase mt-1 font-bold ${m.status === 'normal' ? 'text-emerald-400' : 'text-rose-200'}`}>{m.status}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl p-4 text-slate-900">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">Professional Recommendation</p>
                    {recommendation ? (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold italic shrink-0">
                          {recommendation.name.split(' ').map((n:string)=>n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{recommendation.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{recommendation.specialty} • {recommendation.clinicName}</p>
                        </div>
                        <button onClick={saveReport} disabled={saving} className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                          {saving ? 'Saving...' : 'Book & Save'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                          <Info className="w-4 h-4 text-indigo-500" /> Consult {result.recommendedSpecialty} for follow-up.
                        </p>
                        <button onClick={saveReport} disabled={saving} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold">
                          {saving ? 'Saving...' : 'Save Record'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <LineChart className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-slate-800 font-bold text-lg mb-2">Awaiting Diagnosis</h3>
              <p className="text-slate-400 text-sm max-w-[280px]">Upload a report on the left to activate our system's clinical analysis tools.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- App Root ---

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [view, setView] = useState('history'); // history, doctors, upload
  const [isRegistering, setIsRegistering] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [signupMessage, setSignupMessage] = useState('');

  useEffect(() => {
    // Listen for auth state changes and protect sessions
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        setRole(session.user.user_metadata?.role || 'patient');
      } else {
        // If no session, clear everything to force login
        setToken(null);
        setRole(null);
        localStorage.clear();
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token);
        setRole(session.user.user_metadata?.role || 'patient');
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('role', session.user.user_metadata?.role || 'patient');
      } else {
        setToken(null);
        setRole(null);
        localStorage.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (t: string, r: string) => {
    setToken(t);
    setRole(r);
    localStorage.setItem('token', t);
    localStorage.setItem('role', r);
    setSignupMessage(''); // Clear message on success
  };

  const handleSignupSuccess = (email: string) => {
    setPrefilledEmail(email);
    setSignupMessage('Your account has been created. Please check your email and verify your address before logging in.');
    setIsRegistering(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {isRegistering ? (
          <Register 
            onSwitch={() => {
              setIsRegistering(false);
              setSignupMessage('');
            }} 
            onSuccess={handleSignupSuccess}
          />
        ) : (
          <Login 
            onLogin={handleLogin} 
            onSwitch={() => setIsRegistering(true)}
            initialEmail={prefilledEmail}
            initialMessage={signupMessage}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">ADS <span className="text-slate-300 font-light ml-1">| System</span></h1>
            </div>
            
            <nav className="space-y-1">
              <button onClick={() => setView('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'history' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50'}`}>
                <LineChart className="w-4 h-4" /> Medical History
              </button>
              <button onClick={() => setView('doctors')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'doctors' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Users className="w-4 h-4" /> Specialists
              </button>
              {role === 'patient' && (
                <button onClick={() => setView('upload')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'upload' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Upload className="w-4 h-4" /> Upload Report
                </button>
              )}
            </nav>
          </div>
          
          <div className="mt-auto p-8 border-t border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                {role?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">Alex Johnson</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10 shrink-0">
            <h2 className="font-bold text-slate-800 capitalize tracking-tight">{view.replace('-', ' ')}</h2>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[9px] font-bold uppercase tracking-widest">
                Protected Session
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div 
                key={view} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {view === 'history' && <History token={token} />}
                {view === 'doctors' && <Doctors token={token} userRole={role || ''} />}
                {view === 'upload' && <UploadReport token={token} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Footer Info Bar */}
      <footer className="h-10 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-400 font-bold shrink-0 uppercase tracking-widest">
        <div className="flex gap-6">
          <span>Status: Secure</span>
          <span>Encryption: AES-256</span>
        </div>
        <div>
          © 2026 Assistant Diagnosis System • Clinical Partners Network
        </div>
      </footer>
    </div>
  );
}
