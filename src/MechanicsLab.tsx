import {useMemo,useRef,useState} from 'react';
import {Check,Download,FolderOpen,Search,Target,ThumbsDown,ThumbsUp} from 'lucide-react';
import type {Replay} from './types';
import type {Track,ReplayEvent} from './viewer/model';
import {validateTrack} from './viewer/model';
import {detectEvents,detectors} from './detectors/registry';
type Decision='confirmed'|'rejected'|'unreviewed';
type Annotation={eventKey:string;decision:Decision;notes:string};
const key=(e:ReplayEvent,i:number)=>[e.detector||e.type,e.actorId||'ball',e.time.toFixed(3),i].join('|');
export default function MechanicsLab({replays}:{replays:Replay[]}){
 const [track,setTrack]=useState<Track|null>(null),[replay,setReplay]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[filter,setFilter]=useState(''),[decisions,setDecisions]=useState<Record<string,Annotation>>({});const upload=useRef<HTMLInputElement>(null);
 const candidates=useMemo(()=>track?detectEvents(track):[],[track]);
 const visible=useMemo(()=>candidates.map((event,i)=>({event,key:key(event,i)})).filter(x=>(x.event.detector||'').toLowerCase().includes(filter.toLowerCase())||x.event.label.toLowerCase().includes(filter.toLowerCase())),[candidates,filter]);
 function update(eventKey:string,patch:Partial<Annotation>){setDecisions(all=>({...all,[eventKey]:{eventKey,decision:'unreviewed',notes:'',...all[eventKey],...patch}}))}
 function loaded(data:Track){setTrack(data);setDecisions({});setError('')}
 async function decode(){if(!window.replayForge||!replay)return;setLoading(true);try{loaded(validateTrack(await window.replayForge.decodeReplay(replay)))}catch(e){setError(String(e))}finally{setLoading(false)}}
 async function onJson(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;try{loaded(validateTrack(JSON.parse(await file.text())))}catch(e){setError(String(e))}e.target.value=''}
 function exportReview(){if(!track)return;const body={format:'replay-forge-detector-review-v1',track:track.title,exportedAt:new Date().toISOString(),detectors:detectors.map(d=>({id:d.id,version:d.version})),annotations:candidates.map((event,i)=>({event,annotation:decisions[key(event,i)]||{decision:'unreviewed',notes:''}}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='replay-forge-detector-review.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 const confirmed=Object.values(decisions).filter(d=>d.decision==='confirmed').length,rejected=Object.values(decisions).filter(d=>d.decision==='rejected').length;
 return <div className="lab-workspace"><section className="panel lab-toolbar"><div><h2>Detector review</h2><p>Inspect low-confidence physics candidates. Review decisions do not automatically change detector accuracy.</p></div><div className="tools">
 <select value={replay} onChange={e=>setReplay(e.target.value)}><option value="">Select an imported replay</option>{replays.map(r=><option key={r.path} value={r.path}>{r.name}</option>)}</select>
 <button className="secondary" disabled={!replay||loading} onClick={decode}>{loading?'Decoding…':'Analyze replay'}</button>
 <input type="file" accept=".json" ref={upload} hidden onChange={onJson}/><button className="secondary" onClick={()=>upload.current?.click()}><FolderOpen size={15}/> Open track JSON</button>
 </div></section>
 {error&&<div className="error">{error}</div>}
 <div className="lab-stats">{[{label:'Candidates',value:candidates.length},{label:'Confirmed',value:confirmed},{label:'Rejected',value:rejected},{label:'Detectors',value:detectors.length}].map(s=><div key={s.label} className="metric"><span className="metric-title">{s.label}</span><strong>{s.value}</strong></div>)}</div>
 <section className="panel"><div className="panel-head"><div><h2>Candidate events</h2><p>{track?track.title:'Load a decoded replay or normalized JSON to begin reviewing detections.'}</p></div><div className="tools"><div className="search"><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter detector or label"/></div><button className="secondary" disabled={!track} onClick={exportReview}><Download size={15}/> Export reviews</button></div></div>
 {visible.length?<div className="scroll lab-rows"><table><thead><tr><th>TIME</th><th>DETECTOR EVENT</th><th>CONFIDENCE</th><th>REVIEW</th><th>NOTES</th></tr></thead><tbody>{visible.slice(0,1500).map(({event,key:k})=><tr key={k}><td>{event.time.toFixed(2)}s</td><td><div className="filename">{event.label}</div><div className="file-path">{event.detector||'unknown detector'}</div></td><td>{typeof event.confidence==='number'?Math.round(100*event.confidence)+'%':'Unknown'}</td><td><div className="lab-decisions"><button aria-label="Confirm event" className={decisions[k]?.decision==='confirmed'?'is-confirmed':''} onClick={()=>update(k,{decision:'confirmed'})}><ThumbsUp size={15}/></button><button aria-label="Reject event" className={decisions[k]?.decision==='rejected'?'is-rejected':''} onClick={()=>update(k,{decision:'rejected'})}><ThumbsDown size={15}/></button></div></td><td><input aria-label="Review notes" value={decisions[k]?.notes||''} placeholder="Optional evidence note" onChange={e=>update(k,{notes:e.target.value})}/></td></tr>)}</tbody></table></div>:<div className="empty"><Target size={32}/><h3>{track?'No candidates detected':'No replay loaded'}</h3><p>{track?'Current detectors require velocity/height transitions and may produce no candidates for sparse replay data.':'Choose a replay or import track JSON.'}</p></div>}
 </section><p className="lab-disclaimer"><Check size={15}/> A manually confirmed candidate is a review label, not proof that a named Rocket League mechanic occurred. Further validation requires frame-accurate examples.</p></div>
}
