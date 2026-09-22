'use client';
import { ArrowRight, UserPlus, LogIn, Lock, Mail } from 'lucide-react';

export default function Auth({ email, password, setEmail, setPassword, auth, status }: any) {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050810] px-6">
      {/* Background accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.15] bg-gradient-to-r from-indigo-500 to-purple-500 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.1] bg-gradient-to-r from-blue-500 to-teal-500 blur-[120px]" />

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-widest uppercase">
            Prep <span className="opacity-50">/</span> Kit
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white">
            Rehearse for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              the parts that matter.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-md">
            Turn any job description into a tailored interview prep studio. We research the company, map the role, and find your gaps.
          </p>
        </div>

        <div className="glass-card p-1 lg:p-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); auth('login'); }} 
            className="bg-[#0f172a] rounded-[10px] p-8 lg:p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-80" />
            
            <h2 className="text-2xl font-bold mb-8">Access Studio</h2>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    type="email" 
                    required 
                    placeholder="you@example.com"
                    className="w-full bg-[#1e293b] border border-slate-700/50 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    type="password" 
                    minLength={8} 
                    required 
                    placeholder="••••••••"
                    className="w-full bg-[#1e293b] border border-slate-700/50 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm" 
                  />
                </div>
              </div>
            </div>

            {status && (
              <div className={`mt-6 p-3 rounded bg-slate-900/50 border text-sm ${status.toLowerCase().includes('fail') || status.toLowerCase().includes('error') ? 'border-red-500/20 text-red-400' : 'border-indigo-500/20 text-indigo-400'}`}>
                {status}
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button 
                type="submit"
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-colors group"
              >
                Log In
                <LogIn className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              </button>
              <button 
                type="button" 
                onClick={() => auth('register')} 
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-colors group"
              >
                Create Account
                <UserPlus className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
