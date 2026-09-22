'use client';
import { useEffect, useState } from 'react';
import { LogOut, Diamond } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Builder from './components/Builder';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const stages = ['Validating input', 'Extracting requirements', 'Crawling company website', 'Searching public discussion', 'Generating company brief', 'Generating technical questions', 'Generating behavioural questions', 'Generating flashcards', 'Building schedule', 'Validating kit'];

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [kits, setKits] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState('overview');
  
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressIntervalId, setProgressIntervalId] = useState<NodeJS.Timeout | null>(null);

  async function request(path: string, options: RequestInit = {}) { 
    const response = await fetch(`${API}${path}`, { 
      ...options, 
      credentials: 'include', 
      headers: { 'content-type': 'application/json', ...(options.headers || {}) } 
    }); 
    const body = response.status === 204 ? null : await response.json(); 
    if (!response.ok) throw new Error(body?.error?.message || 'Request failed'); 
    return body; 
  }

  useEffect(() => { 
    request('/api/auth/me')
      .then((body) => { 
        setUser(body.user); 
        return request('/api/kits'); 
      })
      .then(setKits)
      .catch(() => undefined); 
  }, []);

  async function auth(mode: 'register' | 'login') { 
    try { 
      const body = await request(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email, password }) }); 
      setUser(body.user); 
      setStatus(''); 
      setKits(await request('/api/kits')); 
    } catch (error) { 
      setStatus(error instanceof Error ? error.message : 'Authentication failed'); 
    } 
  }

  async function logout() { 
    await request('/api/auth/logout', { method: 'POST' }); 
    setUser(null); 
    setKits([]); 
    setSelected(null); 
    setStatus(''); 
  }

  async function create(input: { jd: string; company_url: string; days: number }) { 
    setLoading(true); 
    
    // Simulate progress updates for long-running generation
    let stageIndex = 0;
    setStatus(`Running: ${stages[0]}`);
    const interval = setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stages.length - 1);
      setStatus(`Running: ${stages[stageIndex]}`);
    }, 3500); // Update stage visually every 3.5s
    setProgressIntervalId(interval);

    try { 
      const body = await request('/api/kits', { method: 'POST', body: JSON.stringify(input) }); 
      clearInterval(interval);
      setSelected(body); 
      setKits([body, ...kits]); 
      setTab('builder'); 
      setStatus(''); 
    } catch (error) { 
      clearInterval(interval);
      setStatus(`Failed: ${error instanceof Error ? error.message : 'Generation failed'}`); 
    } finally { 
      clearInterval(interval);
      setLoading(false); 
    } 
  }

  if (!user) {
    return <Auth email={email} password={password} setEmail={setEmail} setPassword={setPassword} auth={auth} status={status} />;
  }

  return (
    <main className="min-h-screen bg-[#050810] relative text-white">
      {/* Universal Background Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[0%] left-[20%] w-[50%] h-[50%] rounded-full opacity-[0.03] bg-gradient-to-r from-indigo-500 to-purple-500 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 md:px-10 relative z-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/50 pb-6 mb-8 bg-transparent">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
               <Diamond className="w-5 h-5 text-indigo-400" />
             </div>
             <div>
               <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Prep <span className="opacity-50">/</span> Kit</div>
               <p className="mt-0.5 text-xs text-slate-500 font-mono">{user.email}</p>
             </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 group text-xs uppercase tracking-[0.15em] font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Log Out
            <LogOut className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </header>

        {selected ? (
          <Builder item={selected} tab={tab} setTab={setTab} setSelected={setSelected} setStatus={setStatus} request={request} />
        ) : (
          <Dashboard kits={kits} onOpen={(item: any) => { setSelected(item); setTab('builder'); }} onCreate={create} loading={loading} status={status} request={request} />
        )}
      </div>
    </main>
  );
}
