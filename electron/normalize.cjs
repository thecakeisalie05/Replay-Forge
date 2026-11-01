// Boxcars -> Replay Forge normalized track.
// Actor identities and player identities are deliberately distinct. Actor lifecycles can
// contain arbitrarily many spawns; only concurrently active cars are viewer candidates.
const vector=v=>v&&[v.x,v.y,v.z].every(Number.isFinite)?[v.x,v.y,v.z]:null;
const id=v=>Number(v&&typeof v==='object'?v.value:v);
const value=(v,key)=>v&&typeof v==='object'?v[key]:undefined;
const isCar=s=>/(?:^|[.])Car_(?:TA|Default)|Archetypes\.Car\./i.test(s);
const isBall=s=>/(?:^|[.])Ball_(?:TA|Default|Breakout|Hoops|Puck|Cube)|Archetypes\.Ball\./i.test(s);
function rigid(v){
 // serde serializes enum variants e.g. {"RigidBody":{"location":{...},...}}
 const body=value(v,'RigidBody')||value(v,'rigid_body');
 if(!body)return null;
 const location=vector(body.location);if(!location)return null;
 const pose={position:location};
 const velocity=vector(body.linear_velocity);if(velocity)pose.velocity=velocity;
 return pose;
}
function normalize(input,title){
 const raw=input?.replay||input;
 const frames=raw?.network_frames?.frames;
 if(!Array.isArray(frames))throw Error('Boxcars network frames missing');
 const objects=raw.objects||[];
 const actors=new Map(),physical=new Map(),carMetadata=new Map();
 const output=[];let warnings=0,peakCars=0,totalCarSpawns=0,lastTime=-Infinity;
 for(const frame of frames){
  if(!Number.isFinite(frame.time)||frame.time<=lastTime){warnings++;continue}
  lastTime=frame.time;
  for(const deleted of frame.deleted_actors||[]){
   const key=id(deleted),actor=actors.get(key);
   if(actor){physical.delete(key);actors.delete(key)}
  }
  for(const spawned of frame.new_actors||[]){
   const actorId=id(spawned.actor_id),objectName=String(objects[id(spawned.object_id)]||'');
   if(!Number.isFinite(actorId))continue;
   // An actor ID can be reused within a replay. Treat a respawn as a new lifetime,
   // not a new player (and do not keep the old pose).
   physical.delete(actorId);
   const kind=isBall(objectName)?'ball':isCar(objectName)?'car':'other';
   const actor={id:actorId,kind,objectName,serial:++totalCarSpawns};
   if(kind!=='car')totalCarSpawns--;
   actors.set(actorId,actor);
   const location=vector(spawned.initial_trajectory?.location);
   if(location&&(kind==='car'||kind==='ball'))physical.set(actorId,{position:location});
   if(kind==='car'&&!carMetadata.has(actorId))carMetadata.set(actorId,{id:'actor-'+actorId,name:'Car actor '+actorId+' (unresolved)',team:'blue'});
  }
  for(const updated of frame.updated_actors||[]){
   const actorId=id(updated.actor_id),actor=actors.get(actorId);
   if(!actor||actor.kind==='other')continue;
   // object_id indexes objects[], the property key; attribute is the *tagged value*.
   const prop=String(objects[id(updated.object_id)]||'');
   const v=updated.attribute;
   if(/(?:ReplicatedRBState|RigidBody|ReplicatedMovement)/i.test(prop)||value(v,'RigidBody')){
    const p=rigid(v);
    if(p)physical.set(actorId,{...physical.get(actorId),...p});
    else warnings++;
   }
  }
  let ball=null;const cars={};let active=0;
  for(const [actorId,actor] of actors){
   if(actor.kind==='other')continue;
   const pose=physical.get(actorId);if(!pose)continue;
   if(actor.kind==='ball')ball=pose;
   else {cars['actor-'+actorId]={...pose};active++}
  }
  peakCars=Math.max(peakCars,active);
  if(ball)output.push({time:frame.time,ball:{...ball},cars});
 }
 if(output.length<2)throw Error('No usable ball physics frames decoded; replay schema may be unsupported');
 const used=new Set();for(const frame of output)for(const id of Object.keys(frame.cars))used.add(id);
 const players=[...carMetadata.values()].filter(p=>used.has(p.id));
 return {format:'replay-forge-tracks-v1',title,source:'decoded',players,frames:output,events:[],decode:{engine:'boxcars',quality:'partial',warningCount:warnings,peakCars,totalCarSpawns,actorCount:players.length,identityConfidence:'unresolved',teamConfidence:'unresolved'}};
}
module.exports={normalize};
