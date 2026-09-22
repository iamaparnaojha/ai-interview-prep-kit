import React, { ChangeEvent, useState } from 'react';
import { Briefcase, Link as LinkIcon, Calendar, Upload, Plus, AlertCircle, CheckCircle2, ChevronRight, LayoutDashboard, Settings, Loader2 } from 'lucide-react';

export default function Dashboard({ kits, onOpen, onCreate, loading, status, request }: any) {
  const [jd, setJd] = useState('');
  const [url, setUrl] = useState('');
  const [days, setDays] = useState(5);
  const [uploadStatus, setUploadStatus] = useState('');

  // Extract progress info from status string if available
  const currentStageName = status.includes(':') ? status.split(':')[1].trim() : status;
  
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadStatus('Reading file...');
    try {
      const cases = JSON.parse(await file.text()) as Array<{ jd?: string; company_url?: string; days?: number }>;
      if (!Array.isArray(cases)) throw new Error('Upload must be a JSON array.');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < cases.length; i++) {
        const item = cases[i];
        if (!item.jd || !item.company_url || !Number.isInteger(item.days)) {
          errorCount++;
          continue;
        }
        setUploadStatus(`Processing role ${i + 1} of ${cases.length}...`);
        try {
          await request('/api/kits', { method: 'POST', body: JSON.stringify({ jd: item.jd, company_url: item.company_url, days: item.days }) });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
      setUploadStatus(`Completed: ${successCount} built, ${errorCount} failed. Refresh to see updates.`);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Invalid upload format');
    }
  }

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section */}
      <section className="pt-8 pb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Dashboard
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl">
          Build a new interview kit or continue practicing your existing ones. Every kit is uniquely parsed based on the role and company evidence.
        </p>
      </section>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        {/* Left Column - Kit List */}
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-200">
              <LayoutDashboard className="w-5 h-5 text-indigo-400" />
              Your Interview Kits
            </h2>
            <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-slate-300">
              {kits.length} Total
            </span>
          </div>

          {kits.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white/[0.02]">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-indigo-400 opacity-50" />
              </div>
              <p className="text-slate-300 font-medium text-lg">No kits yet</p>
              <p className="text-slate-500 mt-2 max-w-sm">Use the builder on the right to create your first interview prep kit.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {kits.map((item: any) => (
                <button 
                  key={item.id} 
                  onClick={() => onOpen(item)}
                  className="glass-card text-left p-5 group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 truncate max-w-[150px]">
                      {item.kit.source.company}
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                      {item.kit.schedule.days_available} Days
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-4 line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
                    {item.kit.role.title}
                  </h3>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Updated {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Builder Form */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass-card p-6 sticky top-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200 mb-6">
              <Plus className="w-5 h-5 text-indigo-400" />
              New Kit
            </h2>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Job Description</label>
                <textarea 
                  value={jd} 
                  onChange={(e) => setJd(e.target.value)} 
                  rows={6}
                  placeholder="Paste the full job description here..."
                  className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company Website</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Days Until Interview</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="number" 
                    min={1} 
                    max={60} 
                    value={days} 
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-200 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Min 1, Max 60</p>
              </div>
              
              {/* Progress UI */}
              {loading && (
                <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-3 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-indigo-300 font-medium animate-pulse">Building Kit...</span>
                    <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  </div>
                  <div className="text-sm font-mono text-slate-300 truncate">
                    {currentStageName || 'Initializing...'}
                  </div>
                  <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 loading-shimmer" />
                  </div>
                </div>
              )}

              {(!loading && status && status.toLowerCase().includes('fail')) && (
                 <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 items-start mt-4">
                   <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                   <p className="text-xs text-red-300 leading-relaxed">{status}</p>
                 </div>
              )}

              <button 
                disabled={loading || !jd.trim() || !url.trim()} 
                onClick={() => onCreate({ jd, company_url: url, days })}
                className="w-full bg-white text-[#0a0f1a] hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-colors relative overflow-hidden group mt-6"
              >
                {loading ? 'Processing...' : 'Generate Kit'}
                {!loading && <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />}
              </button>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-slate-500">OR BATCH UPLOAD</span>
                </div>
              </div>

              <label className="block cursor-pointer">
                <div className="border border-dashed border-slate-700 hover:border-indigo-500/50 bg-[#0a0f1a] rounded-lg p-4 text-center transition-colors group">
                  <Upload className="w-5 h-5 mx-auto text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                  <span className="text-xs text-slate-400 block">Upload cases.json</span>
                  <input type="file" accept="application/json,.json" onChange={upload} className="hidden" disabled={loading} />
                </div>
              </label>

              {uploadStatus && (
                <div className={`text-xs p-2 rounded ${uploadStatus.includes('failed') || uploadStatus.includes('Invalid') ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-300'}`}>
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
