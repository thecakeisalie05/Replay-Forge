import {useEffect,useMemo,useState} from 'react';
import {Activity,BarChart3,RefreshCcw,Square,AlertTriangle} from 'lucide-react';
import {CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import type {AnalysisEntry,AnalysisProgress,AnalysisPlayer} from './types';
type Choice='averageSpeedUUPerS'|'peakSpeedUUPerS'|'secondsAbove130'|'boostSpent'|'secondsWithoutBoost'|'goals'|'saves'|'shots';
const options:{key:Choice;name:string;unit:string}[]=[
 {key:'averageSpeedUUPerS',name:'Average car speed',unit:'uu/s'},
 {key:'peakSpeedUUPerS',name:'Peak car speed',unit:'uu/s'},
 {key:'secondsAbove130',name:'Time above 130 uu',unit:'seconds'},
 {key:'boostSpent',name:'Observed boost consumption',unit:'points'},
 {key:'secondsWithoutBoost',name:'Observed zero-boost time',unit:'seconds'},
 {key:'goals',name:'Credited goals',unit:'goals'},
 {key:'saves',name:'Credited saves',unit:'saves'},
 {key:'shots',name:'Credited shots',unit:'shots'}
];
export default function Analytics(){
 const [entries,setEntries]=useState<AnalysisEntry[]>([]),[progress,setProgress]=useState<AnalysisProgress|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[choice,setChoice]=useState<Choice>('averageSpeedUUPerS'),[player,setPlayer]=useState('');
 const refresh=async()=>{const api=window.replayForge;if(!api)return;setEntries(Object.values(await api.getAnalysis()))};
 useEffect(()=>{refresh().catch(e=>setError(String(e)));const off=window.replayForge?.onAnalysisProgress(p=>{setProgress(p);if(!p.active)refresh().catch(()=>{})});return()=>off?.()},[]);
 async function run(){if(!window.replayForge)return;setBusy(true);setError('');try{await window.replayForge.analyzeLibrary();await refresh()}catch(e){setError(String(e))}finally{setBusy(false)}}
 const ok=entries.filter(e=>e.status==='ok');
 const players=useMemo(()=>[...new Set(ok.flatMap(e=>(e.players||[]).filter(p=>!p.name.startsWith('Unresolved ')&&p.coverage>.05).map(p=>p.name)))].sort(),[entries]);
 const selected=player&&players.includes(player)?player:players[0]||'';
 const series=useMemo(()=>ok.flatMap(e=>(e.players||[]).filter(p=>p.name===selected&&p.coverage>.05).map(p=>({date:e.sourceDate||e.fileDate||'',filename:e.filename,value:(['goals','saves','shots'].includes(choice)?p.credited?.[choice as 'goals'|'saves'|'shots']:p[choice as keyof AnalysisPlayer]) as number|null|undefined,coverage:p.coverage}))).filter(p=>p.value!==null&&p.value!==undefined).sort((a,b)=>a.date.localeCompare(b.date)),[entries,choice,selected]);
 const unit=options.find(o=>o.key===choice)?.unit||'';
 const failures=entries.filter(e=>e.status==='error');
 return <div className="analytics-workspace"><div className="analytics-toolbar"><div><h2>Directory performance trends</h2><p>Cache decoded match summaries; compare only confidently identified player names.</p></div><div className="tools"><button className="secondary" onClick={refresh}><RefreshCcw size={15}/> Refresh</button>{busy?<button className="secondary" onClick={()=>window.replayForge?.cancelAnalysis()}><Square size={14}/> Stop after current replay</button>:<button className="primary" onClick={run}><Activity size={16}/> Analyze imported directory</button>}</div></div>
 {error&&<div className="error">{error}</div>}
 <div className="analytics-stats">{[{n:'Analyzed',v:ok.length},{n:'Failed',v:failures.length},{n:'Named players',v:players.length},{n:'Match points',v:series.length}].map(a=><div key={a.n} className="metric"><div className="metric-title">{a.n}</div><strong>{a.v}</strong></div>)}</div>
 {progress?.active&&<div className="progress-banner"><Activity size={16}/> Decoding {progress.completed}/{progress.total} · {progress.decoded} new · {progress.failed} failed</div>}
 <section className="panel analytics-panel"><div className="panel-head"><div><h2>Player trajectory</h2><p>Sorted by recorded date if available; otherwise by filesystem modified date.</p></div><div className="tools"><select value={selected} onChange={e=>setPlayer(e.target.value)}>{players.length?players.map(p=><option key={p} value={p}>{p}</option>):<option value="">No attributed players</option>}</select><select value={choice} onChange={e=>setChoice(e.target.value as Choice)}>{options.map(o=><option key={o.key} value={o.key}>{o.name}</option>)}</select></div></div>
 {series.length? <div style={{height:310,padding:'20px 22px'}}><ResponsiveContainer width="100%" height="100%"><LineChart data={series} margin={{top:5,right:22,left:4,bottom:5}}><CartesianGrid stroke="#24364a" strokeDasharray="4 5"/><XAxis dataKey="date" tickFormatter={d=>String(d).slice(0,10)} stroke="#7891aa" fontSize={10}/><YAxis stroke="#7891aa" fontSize={11} unit={' '+unit}/><Tooltip contentStyle={{background:'#132236',border:'1px solid #36506b',color:'#e8f0ff'}} labelFormatter={v=>'Date: '+String(v).slice(0,10)} formatter={v=>[Number(v).toFixed(2)+' '+unit,options.find(o=>o.key===choice)?.name||choice]}/><Line type="monotone" dataKey="value" name={choice} stroke="#75c3f5" strokeWidth={2} dot={{fill:'#75c3f5',r:3}} connectNulls={false}/></LineChart></ResponsiveContainer></div>:<div className="empty"><BarChart3 size={30}/><h3>No comparable decoded matches yet</h3><p>Import replays in Library and choose Analyze. Games with missing player identity remain excluded from name-based progression charts.</p></div>}
 </section><div className="analytics-warning"><AlertTriangle size={15}/><span>These are sampled trajectory measurements, not official Rocket League game stats. Air-time uses a height threshold; boost values may be unavailable. Recorded date and player associations require verification.</span></div>
 {failures.length>0&&<section className="panel analytics-panel"><div className="panel-head"><h2>Files requiring attention ({failures.length})</h2></div><div className="analytics-errors">{failures.slice(0,30).map(e=><p key={e.sha256}><strong>{e.filename}:</strong> {e.error}</p>)}</div></section>}
 </div>;
}
