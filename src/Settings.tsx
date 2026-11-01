import {useEffect,useState} from 'react';
import {Database,HardDrive,Monitor,Settings2,Trash2} from 'lucide-react';
type Status={version:string;platform:string;packaged:boolean;decoderInstalled:boolean;dataDirectory:string};
export default function Settings(){
 const [status,setStatus]=useState<Status|null>(null),[error,setError]=useState(''),[compact,setCompact]=useState(localStorage.getItem('rf:compact')==='yes');
 useEffect(()=>{window.replayForge?.getStatus().then(setStatus).catch(e=>setError(String(e)))},[]);
 useEffect(()=>{document.documentElement.classList.toggle('compact',compact);localStorage.setItem('rf:compact',compact?'yes':'no')},[compact]);
 async function clear(){if(!window.replayForge)return;try{const ok=await window.replayForge.clearAnalysis();if(ok)setError('Cached analysis summaries cleared. Original replay files were not modified.')}catch(e){setError(String(e))}}
 return <div className="settings-grid">
 <section className="panel settings-card"><h2><Monitor size={17}/> Runtime</h2><p>Current desktop environment and decoder availability.</p>{[
 ['App version',status?.version||'Unavailable'],['Platform',status?.platform||'Browser preview'],['Packaged',status?.packaged?'Yes':'No'],['Rust Boxcars helper',status?.decoderInstalled?'Available':'Not detected']
 ].map(([k,v])=><div className="info" key={k}><span>{k}</span><strong>{v}</strong></div>)}</section>
 <section className="panel settings-card"><h2><Settings2 size={17}/> Appearance</h2><p>Display preferences are stored locally.</p><label className="setting-toggle"><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/> Compact table row density</label></section>
 <section className="panel settings-card"><h2><Database size={17}/> Local storage</h2><p>Index and analysis summaries stay on this computer.</p><div className="info"><span>Data directory</span><strong>{status?.dataDirectory||'Unavailable'}</strong></div><button className="secondary" onClick={clear}><Trash2 size={15}/> Clear cached analysis…</button><p>Clearing cache does not delete source replays or the import library.</p></section>
 <section className="panel settings-card"><h2><HardDrive size={17}/> Data integrity</h2><p>Replay Forge reads original replay files and stores derived data separately. Unverified mechanics are labeled as candidates. Windows installer signing, automated watcher-based refresh and advanced privacy settings remain future work.</p></section>
 {error&&<div className="error">{error}</div>}</div>;
}
