import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Save, Plus, ArrowUp, ArrowDown, Trash2, Pin, Eye, EyeOff, Target, Clock, CheckCircle2, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

export default function Builder({ item, tab, setTab, setSelected, setStatus, request }: any) {
  const [kit, setKit] = useState(item.kit);
  const [version, setVersion] = useState(item.version);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState('');

  const tabs = ['overview', 'questions', 'flashcards', 'schedule', 'weak spots'];
  const cards = useMemo(() => [...kit.flashcards], [kit.flashcards]);

  function updateStatus(text: string, isError = false) {
    setStatusText(text);
    setTimeout(() => setStatusText(''), 3000);
  }

  async function save(next: any) {
    setIsSaving(true);
    updateStatus('Saving...');
    try {
      const body = await request(`/api/kits/${item.id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ kit: next, expectedVersion: version }) 
      });
      setKit(body.kit);
      setVersion(body.version);
      updateStatus('Saved successfully');
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : 'Save failed', true);
    } finally {
      setIsSaving(false);
    }
  }

  async function regenerate(category: string) {
    updateStatus(`Regenerating ${category}...`);
    try {
      const body = await request(`/api/kits/${item.id}/regenerate/questions/${category}`, { method: 'POST' });
      setKit(body.kit);
      setVersion(body.version);
      updateStatus(`${category} regenerated`);
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : 'Regen failed', true);
    }
  }

  async function regenerateBrief() {
    updateStatus('Regenerating brief...');
    try {
      const body = await request(`/api/kits/${item.id}/regenerate/company-brief`, { method: 'POST' });
      setKit(body.kit);
      setVersion(body.version);
      updateStatus('Brief regenerated');
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : 'Regen failed', true);
    }
  }
  
  async function regenerateSchedule() {
    updateStatus('Regenerating schedule...');
    try {
      const body = await request(`/api/kits/${item.id}/regenerate/schedule`, { method: 'POST' });
      setKit(body.kit);
      setVersion(body.version);
      updateStatus('Schedule regenerated');
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : 'Regen failed', true);
    }
  }

  async function confidence(value: number) {
    try {
      await request(`/api/kits/${item.id}/practice/${cards[practiceIndex].id}/confidence`, { 
        method: 'POST', body: JSON.stringify({ confidence: value }) 
      });
      setRevealed(false);
      setPracticeIndex((practiceIndex + 1) % Math.max(cards.length, 1));
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : 'Save failed', true);
    }
  }

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-6 pt-4">
        <button 
          onClick={() => setSelected(null)} 
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
      </div>

      <div className="glass-card p-6 md:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Target className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase">
              {kit.source.company}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              {kit.role.title}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {kit.role.requirements.length} Requirements</span>
              <span className="flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-blue-400" /> {kit.questions.length} Questions</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-400" /> {kit.schedule.days_available} Days</span>
              {kit.coverage.uncovered_requirement_ids.length > 0 && (
                <span className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                  <AlertCircle className="w-3.5 h-3.5" /> 
                  {kit.coverage.uncovered_requirement_ids.length} Gaps Found
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-3 min-w-[200px] flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Status</span>
            <span className={`text-sm font-medium flex items-center gap-2 ${statusText.includes('failed') ? 'text-red-400' : 'text-indigo-400'}`}>
               {isSaving && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
               {statusText || 'Saved'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
        {tabs.map((name) => (
          <button 
            key={name} 
            onClick={() => setTab(name)} 
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
              tab === name 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {name}
          </button>
        ))}
      </nav>

      <div className="min-h-[500px]">
        {tab === 'overview' && <Overview kit={kit} save={save} regenerate={regenerateBrief} />}
        {tab === 'questions' && <Questions kit={kit} setKit={setKit} save={save} regenerate={regenerate} />}
        {tab === 'flashcards' && <Flashcards kit={kit} setKit={setKit} save={save} cards={cards} index={practiceIndex} revealed={revealed} setRevealed={setRevealed} confidence={confidence} />}
        {tab === 'schedule' && <Schedule kit={kit} regenerateSchedule={regenerateSchedule} />}
        {tab === 'weak spots' && <WeakSpots item={item} request={request} />}
      </div>
    </div>
  );
}

// Subcomponents
function HelpCircle(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>;
}

function Loader2(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}

function Overview({ kit, save, regenerate }: any) { 
  const [summary, setSummary] = useState(kit.company_brief.summary); 
  const [what, setWhat] = useState(kit.company_brief.what_they_do); 
  
  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-slide-up">
      <article className="glass-card p-6 md:p-8 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Target className="text-indigo-400 w-5 h-5"/> Company Brief</h2>
          <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded">AI Synthesis</span>
        </div>
        
        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Summary</label>
            <textarea 
              value={summary} 
              onChange={(e) => setSummary(e.target.value)} 
              className="w-full min-h-[120px] bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-slate-200 focus:border-indigo-500 resize-none leading-relaxed" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">What they do / Process</label>
            <textarea 
              value={what} 
              onChange={(e) => setWhat(e.target.value)} 
              className="w-full min-h-[160px] bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-slate-200 focus:border-indigo-500 resize-none leading-relaxed" 
            />
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-3">
          <button 
            onClick={() => save({ ...kit, company_brief: { ...kit.company_brief, summary, what_they_do: what } })} 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" /> Save Brief
          </button>
          <button 
            onClick={regenerate} 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
        </div>
      </article>
      
      <article className="glass-card p-6 md:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-8 border-b border-white/10 pb-4">
          <CheckCircle2 className="text-emerald-400 w-5 h-5"/> Requirements Map
        </h2>
        
        <div className="space-y-3">
          {kit.role.requirements.map((item: any) => (
            <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 transition-colors hover:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{item.id}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                    item.kind === 'technical' ? 'bg-blue-500/10 text-blue-400' :
                    item.kind === 'behavioural' ? 'bg-amber-500/10 text-amber-400' : 
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    {item.kind}
                  </span>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${
                  item.priority === 'must' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {item.priority === 'must' ? 'Required' : 'Nice to have'}
                </span>
              </div>
              <p className="text-sm text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  ); 
}

function Questions({ kit, setKit, save, regenerate }: any) { 
  function update(id: string, field: string, value: any) { setKit({ ...kit, questions: kit.questions.map((question: any) => question.id === id ? { ...question, [field]: value, state: 'edited' } : question) }); } 
  function remove(id: string) { setKit({ ...kit, questions: kit.questions.filter((question: any) => question.id !== id), schedule: { ...kit.schedule, days: kit.schedule.days.map((day: any) => ({ ...day, question_ids: day.question_ids.filter((qid: string) => qid !== id) })) } }); } 
  function move(id: string, direction: number) { const index = kit.questions.findIndex((q: any) => q.id === id); const target = index + direction; if (index < 0 || target < 0 || target >= kit.questions.length) return; const questions = [...kit.questions]; [questions[index], questions[target]] = [questions[target], questions[index]]; setKit({ ...kit, questions }); }
  
  return (
    <div className="animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 glass-card p-4">
        <button 
          onClick={() => setKit({ ...kit, questions: [{ id: `manual-${Date.now()}`, requirement_ids: kit.role.requirements[0] ? [kit.role.requirements[0].id] : [], category: 'technical', prompt: 'Write your question...', answer_outline: 'Write your answer outline...', difficulty: 2, state: 'pinned' }, ...kit.questions] })} 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>
        <div className="flex flex-wrap gap-2">
          {['technical', 'behavioural', 'system-design', 'company-fit'].map((cat) => (
            <button key={cat} onClick={() => regenerate(cat)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors">
              <RefreshCw className="w-3 h-3" /> {cat.split('-')[0]}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        {kit.questions.map((question: any, index: number) => (
          <article key={question.id} className={`glass-card p-6 relative overflow-hidden ${question.state === 'pinned' ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
            {question.state === 'pinned' && <div className="absolute top-0 right-0 border-t-[30px] border-r-[30px] border-t-transparent border-r-amber-500/20" />}
            
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <select value={question.category} onChange={(e) => update(question.id, 'category', e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs uppercase tracking-wider font-semibold text-slate-300">
                <option value="technical">Technical</option><option value="behavioural">Behavioural</option><option value="system-design">System Design</option><option value="company-fit">Company Fit</option>
              </select>
              <select value={question.difficulty} onChange={(e) => update(question.id, 'difficulty', Number(e.target.value))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                <option value={1}>Easy (1)</option><option value={2}>Medium (2)</option><option value={3}>Hard (3)</option>
              </select>
              
              <div className="flex gap-1 ml-auto bg-slate-900/50 rounded-lg p-1 border border-slate-700/50">
                <button onClick={() => move(question.id, -1)} disabled={index===0} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                <button onClick={() => move(question.id, 1)} disabled={index===kit.questions.length-1} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                <div className="w-[1px] bg-slate-700 mx-1"></div>
                <button onClick={() => update(question.id, 'state', question.state === 'pinned' ? 'edited' : 'pinned')} className={`p-1 rounded ${question.state==='pinned'?'bg-amber-500/20 text-amber-400':'hover:bg-slate-700 text-slate-400'}`}><Pin className="w-4 h-4"/></button>
                <button onClick={() => remove(question.id)} className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 ml-1"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Prompt</label>
                <textarea value={question.prompt} onChange={(e) => update(question.id, 'prompt', e.target.value)} className="w-full min-h-[80px] bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-base text-white focus:border-indigo-500 resize-none font-medium" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Answer Strategy</label>
                <textarea value={question.answer_outline} onChange={(e) => update(question.id, 'answer_outline', e.target.value)} className="w-full min-h-[80px] bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-300 focus:border-indigo-500 resize-none" />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Covers:</span>
                <div className="flex flex-wrap gap-1">
                  {question.requirement_ids.map((rid:string) => (
                    <span key={rid} className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{rid}</span>
                  ))}
                </div>
              </div>
              {question.state === 'pinned' && <span className="text-xs text-amber-500 font-semibold tracking-wider uppercase flex items-center gap-1"><Pin className="w-3 h-3"/> Pinned</span>}
              {question.state === 'edited' && <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase flex items-center gap-1">Edited</span>}
            </div>
          </article>
        ))}
      </div>
      
      <div className="sticky bottom-6 mt-8 flex justify-end">
        <button onClick={() => save(kit)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-xl shadow-indigo-900/50 transition-colors">
          <Save className="w-4 h-4" /> Save Question Edits
        </button>
      </div>
    </div>
  ); 
}

function Flashcards({ kit, setKit, save, cards, index, revealed, setRevealed, confidence }: any) { 
  const card = cards[index]; 
  function update(id: string, field: string, value: string) { setKit({ ...kit, flashcards: kit.flashcards.map((item: any) => item.id === id ? { ...item, [field]: value, state: 'edited' } : item) }); } 
  function add() { setKit({ ...kit, flashcards: [{ id: `manual-card-${Date.now()}`, front: 'New prompt', back: 'New answer', requirement_ids: kit.role.requirements[0] ? [kit.role.requirements[0].id] : [], state: 'pinned' }, ...kit.flashcards] }); } 
  function remove(id: string) { setKit({ ...kit, flashcards: kit.flashcards.filter((item: any) => item.id !== id) }); }
  
  return (
    <div className="space-y-12 animate-slide-up">
      {/* Practice View */}
      {card ? (
        <div className="max-w-3xl mx-auto">
          <div className="glass-card overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-700/50 bg-slate-900/30">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Target className="w-4 h-4"/> Practice Mode</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-full">Card {index + 1} of {cards.length}</span>
            </div>
            
            <div className="p-8 md:p-12 min-h-[300px] flex flex-col justify-center relative">
               <h2 className="text-2xl md:text-4xl leading-tight font-semibold text-white text-center mb-10">{card.front}</h2>
               
               {revealed ? (
                 <div className="animate-fade-in bg-slate-900/80 border border-slate-700 rounded-xl p-6 text-center">
                   <p className="text-lg text-slate-300 leading-relaxed">{card.back}</p>
                 </div>
               ) : (
                 <div className="absolute inset-x-0 bottom-0 p-8 flex justify-center bg-gradient-to-t from-slate-900 to-transparent pt-32">
                   <button onClick={() => setRevealed(true)} className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform">
                     <Eye className="w-4 h-4"/> Reveal Answer
                   </button>
                 </div>
               )}
            </div>
            
            {revealed && (
              <div className="p-6 border-t border-slate-700/50 bg-slate-900/80 animate-slide-up">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold text-center mb-4">How well did you know this?</p>
                <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} onClick={() => confidence(value)} className={`py-3 rounded-lg font-bold text-lg transition-all ${
                      value === 1 ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20' :
                      value === 2 ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/20' :
                      value === 3 ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/20' :
                      value === 4 ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20' :
                      'bg-teal-500/10 text-teal-500 hover:bg-teal-500 hover:text-white border border-teal-500/20'
                    }`}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400">No flashcards available. Add one below.</div>
      )}

      {/* Editor View */}
      <div>
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold flex items-center gap-2 text-white"><Pin className="w-5 h-5 text-indigo-400"/> Deck Editor</h3>
           <button onClick={add} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
             <Plus className="w-4 h-4" /> Add Card
           </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {kit.flashcards.map((item: any) => (
            <article key={item.id} className="glass-card p-5 relative group">
              <button onClick={() => remove(item.id)} className="absolute top-4 right-4 p-1.5 bg-slate-900/80 rounded-md text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10"><Trash2 className="w-4 h-4"/></button>
              <div className="space-y-3">
                <input value={item.front} onChange={(e) => update(item.id, 'front', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-md p-3 font-semibold text-white focus:border-indigo-500 pr-10" />
                <textarea value={item.back} onChange={(e) => update(item.id, 'back', e.target.value)} className="w-full min-h-[80px] bg-slate-900/50 border border-slate-700/50 rounded-md p-3 text-sm text-slate-300 focus:border-indigo-500 resize-none" />
              </div>
            </article>
          ))}
        </div>
        
        <div className="sticky bottom-6 mt-8 flex justify-end">
          <button onClick={() => save(kit)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-xl shadow-indigo-900/50 transition-colors">
            <Save className="w-4 h-4" /> Save Deck
          </button>
        </div>
      </div>
    </div>
  ); 
}

function Schedule({ kit, regenerateSchedule }: any) {
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-8">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2 text-white"><Calendar className="w-6 h-6 text-indigo-400"/> Preparation Schedule</h2>
           <p className="text-sm text-slate-400 mt-2 max-w-xl">Topics distributed algorithmically over {kit.schedule.days_available} days, with harder must-have concepts scheduled earlier.</p>
        </div>
        <button onClick={regenerateSchedule} className="flex flex-shrink-0 items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
           <RefreshCw className="w-4 h-4"/> Reallocate
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kit.schedule.days.map((day: any) => (
          <article key={day.day} className="glass-card p-6 flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                Day {day.day}
              </span>
              <span className="text-xs font-mono text-slate-300 bg-slate-900/80 border border-slate-700 px-2 py-1 rounded flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-500"/> ~{day.minutes}m
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 leading-tight flex-1">{day.focus}</h3>
            
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex align-center gap-2 text-sm text-slate-400">
               <span className="font-semibold text-slate-200">{day.question_ids.length}</span> Assigned Questions
            </div>
          </article>
        ))}
      </div>
    </div>
  ); 
}

function WeakSpots({ item, request }: any) { 
  const [data, setData] = useState<any>(null); 
  
  useEffect(() => { 
    request(`/api/kits/${item.id}/weak-spots`).then(setData).catch(() => undefined); 
  }, [item.id, request]); 
  
  return (
    <div className="animate-slide-up max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
          <TrendingUp className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Knowledge Gaps</h2>
        <p className="text-slate-400 mt-3 max-w-lg mx-auto">Cards sorted by lowest confidence scores from your practice sessions. Target these areas first.</p>
      </div>

      <div className="glass-card overflow-hidden">
        {data ? (
          data.weak_spots.length > 0 ? (
            <div className="divide-y divide-slate-700/50">
              {data.weak_spots.map((entry: any, i: number) => (
                <div key={entry.card.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex gap-4 items-start">
                    <span className="text-slate-600 font-mono text-sm pt-0.5">{String(i+1).padStart(2,'0')}</span>
                    <div>
                      <p className="text-white font-medium text-lg leading-snug">{entry.card.front}</p>
                      <div className="flex gap-2 mt-2">
                        {entry.card.requirement_ids.map((rid:string)=>(
                           <span key={rid} className="text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{rid}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center md:flex-col md:items-end gap-2 text-right">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Confidence</span>
                    {entry.progress?.confidence ? (
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg">
                        <div className="flex gap-0.5 mt-0.5">
                          {[1,2,3,4,5].map(v => (
                             <div key={v} className={`w-1.5 h-3 rounded-full ${v <= entry.progress.confidence ? 
                               (entry.progress.confidence <= 2 ? 'bg-red-500' : entry.progress.confidence === 3 ? 'bg-amber-500' : 'bg-emerald-500') 
                               : 'bg-slate-700'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-bold ml-1 text-slate-300">{entry.progress.confidence}/5</span>
                      </div>
                    ) : (
                      <span className="text-xs bg-slate-900 border border-slate-700 text-slate-400 px-3 py-1.5 rounded-lg font-medium">Untried</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
               Practice flashcards first to generate weak spots data.
            </div>
          )
        ) : (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  ); 
}
