// Derived metrics from normalized tracks. No speculative mechanic or game outcome claims.
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function summarize(track){
 const stats=new Map(track.players.map(p=>[p.id,{actorId:p.id,name:p.name,team:p.team,credited:p.credited||null,observedSeconds:0,secondsAbove130:0,secondsWithoutBoost:0,distanceUU:0,peakSpeedUUPerS:0,supersonicSeconds:0,boostSpent:0,peakBoostUseRate:0,observedFrames:0}]));
 const frames=track.frames;
 for(let i=1;i<frames.length;i++){
  const a=frames[i-1],b=frames[i],dt=b.time-a.time;
  if(!(dt>0&&dt<=.2))continue;
  for(const [id,entry] of stats){
   const before=a.cars[id],after=b.cars[id];
   if(!before||!after)continue;
   const d=distance(before.position,after.position),rate=d/dt;
   if(rate>3000)continue; // teleport or discontinuity; exclude instead of inventing movement.
   entry.observedFrames++;entry.observedSeconds+=dt;entry.distanceUU+=d;
   entry.peakSpeedUUPerS=Math.max(entry.peakSpeedUUPerS,rate);
   if(rate>=2200)entry.supersonicSeconds+=dt;
   if(before.position[2]>130&&after.position[2]>130)entry.secondsAbove130+=dt;
   if(before.boost===0&&after.boost===0)entry.secondsWithoutBoost+=dt;
   if(Number.isFinite(before.boost)&&Number.isFinite(after.boost)&&after.boost<before.boost){const spent=before.boost-after.boost;entry.boostSpent+=spent;entry.peakBoostUseRate=Math.max(entry.peakBoostUseRate,spent/dt)}
  }
 }
 const duration=frames.length?frames.at(-1).time-frames[0].time:0;
 return [...stats.values()].map(v=>({...v,averageSpeedUUPerS:v.observedSeconds>0?v.distanceUU/v.observedSeconds:null,averageBoostSpentPerMin:v.observedSeconds>0?v.boostSpent*60/v.observedSeconds:null,goalShotRatio:v.credited?.shots>0?v.credited.goals/v.credited.shots:null,coverage:duration>0?v.observedSeconds/duration:0}));
}
module.exports={summarize};
