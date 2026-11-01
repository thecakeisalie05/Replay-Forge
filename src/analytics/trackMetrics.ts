import type {Track,Pose} from '../viewer/model';
export type TrackMetric={actorId:string;name:string;samples:number;observedSeconds:number;distanceUU:number;averageSpeedUUPerS:number|null;peakSpeedUUPerS:number|null;airSeconds:number;zeroBoostSeconds:number;boostSpent:number;coverage:number};
const norm=(v:number[])=>Math.hypot(v[0],v[1],v[2]);
const dist=(a:number[],b:number[])=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
/** Conservative descriptive metrics of observed samples; no claims about game-credited stats. */
export function summarizeTrack(track:Track):TrackMetric[]{
 const frames=track.frames;
 return track.players.map(player=>{
 let samples=0,distanceUU=0,observedSeconds=0,peak=0,airSeconds=0,zeroBoostSeconds=0,boostSpent=0;
 for(let i=1;i<frames.length;i++){
  const previous=frames[i-1],current=frames[i],dt=current.time-previous.time;
  // Skip missing intervals: no interpolated teleportation across long gaps.
  if(!(dt>0&&dt<=.2))continue;
  const a:Pose|undefined=previous.cars[player.id],b:Pose|undefined=current.cars[player.id];
  if(!a||!b)continue;
  const traveled=dist(a.position,b.position);
  // Skip clear discontinuities: respawns, ID reuse and impossible path jumps.
  if(traveled/dt>3000)continue;
  samples++;observedSeconds+=dt;distanceUU+=traveled;
  peak=Math.max(peak,a.velocity?norm(a.velocity):traveled/dt);
  // Height-only heuristic, not a physics contact state.
  if(a.position[2]>130&&b.position[2]>130)airSeconds+=dt;
  if(a.boost===0&&b.boost===0)zeroBoostSeconds+=dt;
  if(a.boost!==undefined&&b.boost!==undefined&&b.boost<a.boost)boostSpent+=a.boost-b.boost;
 }
 const span=frames.length>1?frames[frames.length-1].time-frames[0].time:0;
 return {actorId:player.id,name:player.name,samples,observedSeconds,distanceUU,
 averageSpeedUUPerS:observedSeconds?distanceUU/observedSeconds:null,
 peakSpeedUUPerS:samples?peak:null,airSeconds,zeroBoostSeconds,boostSpent,
 coverage:span>0?Math.min(1,observedSeconds/span):0};
 });
}
