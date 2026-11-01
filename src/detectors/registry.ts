import type {Track,ReplayEvent,Pose} from '../viewer/model';
export interface Detector {id:string;version:string;label:string;detect(track:Track):ReplayEvent[]}
const speed=(p:Pose)=>p.velocity?Math.hypot(...p.velocity):null;
const candidateMomentumLoss:Detector={
 id:'momentum-loss-candidate',version:'1.0.0',label:'Rapid slowdown',
 detect(track){
  const events:ReplayEvent[]=[],last=new Map<string,number>();
  for(let i=1;i<track.frames.length;i++){
   const a=track.frames[i-1],b=track.frames[i],dt=b.time-a.time;
   if(!(dt>0&&dt<=.2))continue;
   for(const player of track.players){
    const before=a.cars[player.id],after=b.cars[player.id];if(!before||!after)continue;
    const s0=speed(before),s1=speed(after);
    if(s0===null||s1===null||s0<750||s0-s1<350||b.time-(last.get(player.id)||-100)<1.5)continue;
    // Velocity deltas measure motion, not intent; do not call these mechanical failures.
    events.push({time:b.time,type:'momentum',label:player.name+' — rapid slowdown candidate',position:after.position,actorId:player.id,confidence:.4,detector:'momentum-loss-candidate@1.0.0'});
    last.set(player.id,b.time);
   }
  }
  return events;
 }
};
const candidateAerial:Detector={
 id:'aerial-transition-candidate',version:'1.0.0',label:'Rising above ground',
 detect(track){
  const events:ReplayEvent[]=[],last=new Map<string,number>();
  for(let i=1;i<track.frames.length;i++){
   const a=track.frames[i-1],b=track.frames[i],dt=b.time-a.time;if(!(dt>0&&dt<=.2))continue;
   for(const player of track.players){const before=a.cars[player.id],after=b.cars[player.id];if(!before||!after)continue;
    if(before.position[2]<=150&&after.position[2]>150&&(after.velocity?.[2]??0)>0&&b.time-(last.get(player.id)||-100)>1){
     events.push({time:b.time,type:'aerial',label:player.name+' — rising-height candidate',position:after.position,actorId:player.id,confidence:.25,detector:'aerial-transition-candidate@1.0.0'});
     last.set(player.id,b.time);
    }
   }
  }
  return events;
 }
};
export const detectors:Detector[]=[candidateMomentumLoss,candidateAerial];
export function detectEvents(track:Track):ReplayEvent[]{return detectors.flatMap(d=>d.detect(track)).sort((a,b)=>a.time-b.time)}
export function withDetectedEvents(track:Track):Track{return {...track,events:[...track.events,...detectEvents(track)].sort((a,b)=>a.time-b.time)}}
