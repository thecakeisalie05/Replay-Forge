export type Vec3=[number,number,number];
export type Pose={position:Vec3;yaw?:number;velocity?:Vec3;boost?:number};
export type Frame={time:number;ball:Pose;cars:Record<string,Pose>};
export type ReplayEvent={time:number;type:string;label:string;position?:Vec3;actorId?:string;confidence?:number;detector?:string};
export type Track={format:'replay-forge-tracks-v1';title:string;source:'demo'|'decoded';players:{id:string;name:string;team:'blue'|'orange'}[];frames:Frame[];events:ReplayEvent[]};
const vec=(x:number,y:number,z:number):Vec3=>[x,y,z];
export function demoTrack():Track{
 const frames:Frame[]=[];const events:ReplayEvent[]=[{time:0,type:'kickoff',label:'Kickoff'},{time:12,type:'touch',label:'Ball challenge (synthetic)'},{time:30,type:'shot',label:'Shot opportunity (synthetic)'},{time:47,type:'goal',label:'Goal (synthetic)'}];
 for(let i=0;i<=1200;i++){const time=i/20; const a=time*.19, b=time*.28;
 frames.push({time,ball:{position:vec(Math.sin(a)*2450,Math.cos(a*.72)*3100,95+Math.abs(Math.sin(time*.42))*1150),velocity:vec(Math.cos(a)*466,-Math.sin(a*.72)*424,Math.cos(time*.42)*483)},cars:{
 blue1:{position:vec(Math.sin(b)*3000,-2000+Math.cos(b*.85)*2100,35+Math.max(0,Math.sin(time*.57))*430),yaw:b,boost:Math.max(0,80-time*.9)},
 orange1:{position:vec(Math.sin(b+2.3)*2950,1800+Math.cos(b*.8+2)*1950,35+Math.max(0,Math.sin(time*.49))*350),yaw:b+2.3,boost:45},
 blue2:{position:vec(Math.sin(b*.7+1.6)*2900,-1200+Math.cos(b*.8)*2700,35),yaw:-b,boost:85},
 orange2:{position:vec(Math.sin(b*.72+3)*2900,1400+Math.cos(b*.83+2)*2450,35),yaw:b+1,boost:30}
 }});
 }
 return{format:'replay-forge-tracks-v1',title:'Synthetic Viewer Demo · Not a real replay',source:'demo',players:[{id:'blue1',name:'Blue 1',team:'blue'},{id:'blue2',name:'Blue 2',team:'blue'},{id:'orange1',name:'Orange 1',team:'orange'},{id:'orange2',name:'Orange 2',team:'orange'}],frames,events};
}
export function validateTrack(raw:unknown):Track {
 if(!raw||typeof raw!=='object')throw Error('Expected a track object');
 const v=raw as Partial<Track>;
 if(v.format!=='replay-forge-tracks-v1'||!Array.isArray(v.frames)||!Array.isArray(v.players)||!Array.isArray(v.events))throw Error('Unsupported track JSON format');
 if(v.frames.length<2||v.frames.length>250000)throw Error('Track must contain 2 to 250000 frames');
 if(v.players.length>16)throw Error('Too many players');
 const ids=new Set<string>();
 for(const p of v.players){if(typeof p.id!=='string'||typeof p.name!=='string'||!['blue','orange'].includes(p.team)||ids.has(p.id))throw Error('Invalid player entry');ids.add(p.id)}
 const check=(p:Pose)=>p&&Array.isArray(p.position)&&p.position.length===3&&p.position.every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<1000000)&&
 (p.yaw===undefined||Number.isFinite(p.yaw))&&(p.boost===undefined||(Number.isFinite(p.boost)&&p.boost>=0&&p.boost<=100))&&
 (p.velocity===undefined||(Array.isArray(p.velocity)&&p.velocity.length===3&&p.velocity.every(Number.isFinite)));
 let prev=-Infinity;
 for(const f of v.frames){if(!Number.isFinite(f.time)||f.time<=prev||!check(f.ball)||!f.cars||typeof f.cars!=='object')throw Error('Invalid or non-monotonic frame');prev=f.time;for(const [id,p] of Object.entries(f.cars)){if(!ids.has(id)||!check(p))throw Error('Invalid car pose or player ID')}}
 for(const e of v.events){if(!Number.isFinite(e.time)||typeof e.label!=='string'||typeof e.type!=='string')throw Error('Invalid event')}
 return v as Track;
}
export function frameAt(frames:Frame[],time:number){let lo=0,hi=frames.length-1;while(lo<hi){const mid=(lo+hi+1)>>>1;if(frames[mid].time<=time)lo=mid;else hi=mid-1}return lo}
